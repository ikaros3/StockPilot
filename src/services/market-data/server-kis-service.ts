import { kisRateLimiter } from "@/lib/rate-limiter";
import { getDocument, setDocument } from "@/lib/firebase/firestore-rest";

/**
 * ServerKisService
 * 
 * KIS Open API 서버사이드 서비스
 * - firebase-admin 대신 Firestore REST API 사용 (Turbopack 호환)
 * - 토큰 캐싱: 메모리 + Firestore REST
 * - 중복 발급 방지: 쿨다운 + Promise 캐싱
 */

const KIS_API_BASE_URL = {
    prod: "https://openapi.koreainvestment.com:9443",
    vts: "https://openapivts.koreainvestment.com:29443",
};

export type KisEnvironment = "prod" | "vts";

export interface KisEnvConfig {
    appKey: string;
    appSecret: string;
    accountNumber: string;
}

export interface AccessToken {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: Date;
}

// 메모리 토큰 캐시
const memoryTokenCache = new Map<KisEnvironment, AccessToken>();

export class ServerKisService {
    private static tokenRefreshPromises = new Map<KisEnvironment, Promise<string>>();
    private static readonly TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
    private static lastIssuanceAttempt = 0;
    private static readonly ISSUANCE_COOLDOWN_MS = 90 * 1000;

    public static getConfig() {
        const environment = (process.env.KIS_ENVIRONMENT || "vts") as KisEnvironment;
        const prodConfig: KisEnvConfig = {
            appKey: process.env.KIS_PROD_APP_KEY || "",
            appSecret: process.env.KIS_PROD_APP_SECRET || "",
            accountNumber: process.env.KIS_PROD_ACCOUNT_NUMBER || "",
        };
        const vtsConfig: KisEnvConfig = {
            appKey: process.env.KIS_VTS_APP_KEY || "",
            appSecret: process.env.KIS_VTS_APP_SECRET || "",
            accountNumber: process.env.KIS_VTS_ACCOUNT_NUMBER || "",
        };
        const activeConfig = environment === "prod" ? prodConfig : vtsConfig;
        return { environment, config: activeConfig };
    }

    private static getBaseUrl(env: KisEnvironment): string {
        return KIS_API_BASE_URL[env];
    }

    static async getAccessToken(forceRefresh = false): Promise<string> {
        const { environment: env, config } = this.getConfig();
        const now = Date.now();
        const docId = `kis_token_${env}`;

        // 1. 환경변수 고정 토큰
        const pinnedToken = process.env.KIS_ACCESS_TOKEN;
        if (pinnedToken && !forceRefresh) {
            return pinnedToken;
        }

        // 2. 메모리 캐시
        if (forceRefresh) {
            memoryTokenCache.delete(env);
        } else {
            const memToken = memoryTokenCache.get(env);
            if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                return memToken.accessToken;
            }
        }

        // 3. Firestore REST API로 캐시 조회
        if (!forceRefresh) {
            try {
                const data = await getDocument('system_metadata', docId);
                if (data?.accessToken && data?.expiresAt) {
                    const expiresAt = new Date(data.expiresAt);
                    if (now < expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                        const token: AccessToken = {
                            accessToken: data.accessToken,
                            tokenType: data.tokenType || 'Bearer',
                            expiresIn: data.expiresIn || 86400,
                            expiresAt: expiresAt
                        };
                        memoryTokenCache.set(env, token);
                        console.log(`[KIS] Firestore에서 토큰 로드 (만료: ${expiresAt.toISOString()})`);
                        return token.accessToken;
                    }
                }
            } catch (error) {
                console.warn(`[KIS] Firestore 조회 실패:`, error);
            }
        }

        // 4. 동시 요청 방지 - forceRefresh 여부와 관계없이 진행 중인 Promise가 있으면 대기
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise) {
            console.log('[KIS] 기존 토큰 발급 요청 대기 중...');
            return existingPromise;
        }

        // 5. 새 토큰 발급
        const refreshPromise = (async () => {
            try {
                const timeSinceLastIssuance = Date.now() - this.lastIssuanceAttempt;
                if (timeSinceLastIssuance < this.ISSUANCE_COOLDOWN_MS) {
                    console.warn(`[KIS] 쿨다운 중 (${Math.ceil((this.ISSUANCE_COOLDOWN_MS - timeSinceLastIssuance) / 1000)}초)`);
                    const memToken = memoryTokenCache.get(env);
                    return memToken?.accessToken || "";
                }
                this.lastIssuanceAttempt = Date.now();
                return await this.fetchNewToken(env, config);
            } catch (err) {
                console.error(`[KIS] 토큰 발급 오류:`, err);
                return "";
            }
        })();

        this.tokenRefreshPromises.set(env, refreshPromise);
        try {
            return await refreshPromise;
        } finally {
            this.tokenRefreshPromises.delete(env);
        }
    }

    private static async fetchNewToken(env: KisEnvironment, config: KisEnvConfig): Promise<string> {
        if (!config.appKey || !config.appSecret) return "";

        try {
            console.log(`[KIS] 새 토큰 발급 요청 (${env})`);
            const response = await fetch(`${this.getBaseUrl(env)}/oauth2/tokenP`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    grant_type: "client_credentials",
                    appkey: config.appKey,
                    appsecret: config.appSecret,
                }),
                cache: 'no-store'
            });

            if (!response.ok) return "";
            const data = await response.json();
            if (data.error_code) {
                console.error(`[KIS] 토큰 에러: ${data.error_code} - ${data.error_description}`);
                return "";
            }

            if (data.access_token) {
                const expiresAt = new Date(Date.now() + data.expires_in * 1000);
                const token: AccessToken = {
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    expiresAt: expiresAt,
                };

                memoryTokenCache.set(env, token);
                console.log(`[KIS] 토큰 발급 완료 (만료: ${expiresAt.toISOString()})`);

                // Firestore REST API로 저장
                try {
                    await setDocument('system_metadata', `kis_token_${env}`, {
                        accessToken: token.accessToken,
                        tokenType: token.tokenType,
                        expiresIn: token.expiresIn,
                        expiresAt: token.expiresAt,
                        updatedAt: new Date()
                    });
                    console.log('[KIS] Firestore에 토큰 저장 완료');
                } catch (e) {
                    console.warn('[KIS] Firestore 저장 실패 (무시)');
                }

                return token.accessToken;
            }
            return "";
        } catch (error) {
            console.error('[KIS] 토큰 발급 네트워크 오류:', error);
            return "";
        }
    }

    static async callApi(
        path: string,
        trId: string,
        params: Record<string, string> = {},
        method: "GET" | "POST" = "GET",
        isRetry = false
    ): Promise<any> {
        const { environment: env, config } = this.getConfig();
        const token = await this.getAccessToken();

        if (!token) throw new Error("토큰 없음");

        const headers = {
            "Content-Type": "application/json; charset=utf-8",
            authorization: `Bearer ${token}`,
            appkey: config.appKey,
            appsecret: config.appSecret,
            tr_id: trId,
            custtype: "P",
        };

        const baseUrl = this.getBaseUrl(env);

        const data = await kisRateLimiter.execute(async () => {
            try {
                let response: Response;
                if (method === "GET") {
                    const qs = new URLSearchParams(params).toString();
                    response = await fetch(`${baseUrl}${path}?${qs}`, { method: "GET", headers, cache: 'no-store' });
                } else {
                    response = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body: JSON.stringify(params), cache: 'no-store' });
                }
                return await response.json();
            } catch (err) {
                return { rt_cd: "-1" };
            }
        });

        if (data && data.rt_cd !== "0") {
            if (data.msg_cd === "EGW00123" && !isRetry) {
                await this.getAccessToken(true);
                return await this.callApi(path, trId, params, method, true);
            }
            if (data.msg1?.includes("초당 거래건수")) return null;
        }

        return data;
    }

    static async getPrices(symbols: string[]): Promise<Record<string, any>> {
        const { kisRequestQueue } = await import("./kis-request-queue");
        return kisRequestQueue.getPrices(symbols);
    }

    static async getIndices(): Promise<{ indices: any[], isMarketOpen: boolean }> {
        const indices = ["KOSPI", "KOSDAQ", "NASDAQ", "DOW"];
        return {
            indices: indices.map(id => ({ name: id, error: "No data" })),
            isMarketOpen: false
        };
    }
}
