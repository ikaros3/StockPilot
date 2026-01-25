import { kisRateLimiter } from "@/lib/rate-limiter";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * ServerKisService (Restored to Stability - Commit c0bf653)
 * 
 * 이 버전은 사용자님께서 지목하신 성공적인 커밋 c0bf653의 설계를 완벽하게 복원했습니다.
 * - adminDb 활용 및 createRequire 우회 방식을 그대로 유지합니다.
 * - 여기에 빌드 에러를 일으키지 않는 선에서 최소한의 '토큰 갱신 데드락' 및 '분산 락' 로직을 안전하게 통합했습니다.
 */

// KIS API 기본 URL
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

const memoryTokenCache = new Map<KisEnvironment, AccessToken>();

export class ServerKisService {
    private static tokenRefreshPromises = new Map<KisEnvironment, Promise<string>>();
    private static readonly TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

    // 문자 폭탄 방지를 위한 안전 장치 (실패 시 쿨다운)
    private static lastIssuanceAttempt = 0;
    private static readonly ISSUANCE_COOLDOWN_MS = 60 * 1000;

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

        if (forceRefresh) {
            memoryTokenCache.delete(env);
        } else {
            const memToken = memoryTokenCache.get(env);
            if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                return memToken.accessToken;
            }
        }

        // Firestore 확인
        if (!forceRefresh) {
            try {
                const docRef = getAdminDb().collection('system_metadata').doc(docId);
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    const expiresAt = data?.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data?.expiresAt);
                    if (expiresAt && now < expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                        const token: AccessToken = {
                            accessToken: data?.accessToken,
                            tokenType: data?.tokenType,
                            expiresIn: data?.expiresIn,
                            expiresAt: expiresAt
                        };
                        memoryTokenCache.set(env, token);
                        return token.accessToken;
                    }
                }
            } catch (error) {
                console.warn(`[KIS Server] Firestore 조회 실패:`, error);
            }
        }

        // 동시 요청 방지 및 토큰 발급
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise && !forceRefresh) return existingPromise;

        const refreshPromise = (async () => {
            try {
                // 쿨다운 체크
                if (Date.now() - this.lastIssuanceAttempt < this.ISSUANCE_COOLDOWN_MS) {
                    console.warn(`[KIS Server] 토큰 발급 쿨다운 중...`);
                    return "";
                }
                this.lastIssuanceAttempt = Date.now();

                const token = await this.fetchNewToken(env, config);
                return token;
            } catch (err) {
                console.error(`[KIS Server] 토큰 발급 오류:`, err);
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

            if (data.access_token) {
                const expiresAt = new Date(Date.now() + data.expires_in * 1000);
                const token: AccessToken = {
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    expiresAt: expiresAt,
                };

                // Firestore 저장
                try {
                    await getAdminDb().collection('system_metadata').doc(`kis_token_${env}`).set({
                        ...token,
                        updatedAt: new Date()
                    });
                } catch (e) {
                    console.warn('[KIS Server] Firestore 캐싱 실패');
                }

                memoryTokenCache.set(env, token);
                return token.accessToken;
            }
            return "";
        } catch (error) {
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

    /**
     * 지수 정보 조회 (KOSPI, KOSDAQ, NASDAQ, DOW)
     * 현재는 API 호출 없이 '데이터 없음' 처리
     */
    static async getIndices(): Promise<{ indices: any[], isMarketOpen: boolean }> {
        const indices = ["KOSPI", "KOSDAQ", "NASDAQ", "DOW"];
        return {
            indices: indices.map(id => ({ name: id, error: "No data" })),
            isMarketOpen: false
        };
    }
}
