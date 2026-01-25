import { kisRateLimiter } from "@/lib/rate-limiter";
import { getFirestoreDb } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

/**
 * ServerKisService (Stable Architecture Version)
 * 
 * 사용자님께서 지목하신 "마지막 성공 배포 버전(f70c426)"의 설계를 기초로 합니다.
 * - firebase-admin 종속성을 완전히 제거하여 Next.js 16 빌드 에러를 방지했습니다.
 * - 표준 firebase SDK를 통한 Firestore 접근으로 복구하여 모듈 로드 실패를 원천 차단합니다.
 * - 이 안정적인 기반 위에 토큰 캐싱 및 중복 요청 방지 로직을 통합했습니다.
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

// 서버 인스턴스별 메모리 캐시 (Firestore 읽기 최적화용)
const memoryTokenCache = new Map<KisEnvironment, AccessToken>();

export class ServerKisService {
    // 동시 토큰 요청 방지
    private static tokenRefreshPromises = new Map<KisEnvironment, Promise<string>>();

    // 설정값
    private static readonly TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
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
        return {
            environment,
            config: environment === "prod" ? prodConfig : vtsConfig
        };
    }

    private static getBaseUrl(env: KisEnvironment): string {
        return KIS_API_BASE_URL[env];
    }

    /**
     * 액세스 토큰 획득 (Firestore 캐시 지원)
     */
    static async getAccessToken(forceRefresh = false): Promise<string> {
        const { environment: env, config } = this.getConfig();
        const now = Date.now();
        const docId = `kis_token_${env}`;

        if (forceRefresh) {
            memoryTokenCache.delete(env);
        } else {
            // 1. 메모리 캐시
            const memToken = memoryTokenCache.get(env);
            if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                return memToken.accessToken;
            }
        }

        // 2. Firestore 캐시 (표준 SDK 방식)
        if (!forceRefresh) {
            try {
                const db = getFirestoreDb();
                if (db) {
                    const docRef = doc(db, 'system_metadata', docId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);
                        if (expiresAt && now < expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                            const token: AccessToken = {
                                accessToken: data.accessToken,
                                tokenType: data.tokenType,
                                expiresIn: data.expiresIn,
                                expiresAt: expiresAt
                            };
                            memoryTokenCache.set(env, token);
                            return token.accessToken;
                        }
                    }
                }
            } catch (error) {
                console.warn(`[KIS Server] Firestore 토큰 조회 실패:`, error);
            }
        }

        // 3. 토큰 재발급 (중복 요청 방지)
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise && !forceRefresh) return existingPromise;

        const refreshPromise = (async () => {
            try {
                // 분산 락 (표준 SDK 방식)
                if (!forceRefresh) {
                    const db = getFirestoreDb();
                    if (db) {
                        const lockRef = doc(db, 'system_metadata', `kis_token_lock_${env}`);
                        const lockSnap = await getDoc(lockRef);
                        if (lockSnap.exists()) {
                            const lockData = lockSnap.data();
                            const lockTime = lockData.timestamp instanceof Timestamp ? lockData.timestamp.toMillis() : lockData.timestamp;
                            if (lockTime && (now - lockTime < 30000)) {
                                console.log(`[KIS Server] ${env} 다른 인스턴스에서 토큰 발급 중...`);
                                for (let i = 0; i < 10; i++) {
                                    await new Promise(r => setTimeout(r, 500));
                                    const checkSnap = await getDoc(doc(db, 'system_metadata', docId));
                                    if (checkSnap.exists()) {
                                        const checkData = checkSnap.data();
                                        const checkExpiresAt = checkData.expiresAt instanceof Timestamp ? checkData.expiresAt.toDate() : new Date(checkData.expiresAt);
                                        if (checkExpiresAt && Date.now() < checkExpiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                                            return checkData.accessToken;
                                        }
                                    }
                                }
                            }
                        }
                        await setDoc(lockRef, { fetching: true, timestamp: Timestamp.now(), pid: "nextjs-server" });
                    }
                }

                const token = await this.fetchNewToken(env, config);

                const db = getFirestoreDb();
                if (db) {
                    await deleteDoc(doc(db, 'system_metadata', `kis_token_lock_${env}`)).catch(() => { });
                }

                return token;
            } catch (err) {
                console.error(`[KIS Server] 토큰 프로세스 오류:`, err);
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

        const now = Date.now();
        if (now - this.lastIssuanceAttempt < this.ISSUANCE_COOLDOWN_MS) {
            console.warn(`[KIS Server] 토큰 발급 쿨다운 중...`);
            return "";
        }
        this.lastIssuanceAttempt = now;

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

                // Firestore 캐싱 (표준 SDK)
                const db = getFirestoreDb();
                if (db) {
                    setDoc(doc(db, 'system_metadata', `kis_token_${env}`), {
                        ...token,
                        updatedAt: Timestamp.now()
                    }).catch(e => console.warn('[KIS Server] Firestore 캐싱 실패:', e.message));
                }

                memoryTokenCache.set(env, token);
                return token.accessToken;
            }
            return "";
        } catch (error) {
            console.error("[KIS Server] 토큰 발급 예외:", error);
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

        if (!token) throw new Error("API 호출 실패: 액세스 토큰 없음");

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
                return { rt_cd: "-1", msg1: "Network Error" };
            }
        });

        if (data && data.rt_cd !== "0") {
            if (data.msg1?.includes("기간이 만료된 token") || data.msg_cd === "EGW00123") {
                if (!isRetry) {
                    await this.getAccessToken(true);
                    return await this.callApi(path, trId, params, method, true);
                }
            }
            if (data.msg1?.includes("초당 거래건수")) return null;
            console.error(`[KIS Server] API 오류 (${path}): ${data.msg1}`);
        }

        return data;
    }

    static async getPrices(symbols: string[]): Promise<Record<string, any>> {
        const { kisRequestQueue } = await import("./kis-request-queue");
        return kisRequestQueue.getPrices(symbols);
    }
}
