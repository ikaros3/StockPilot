import { kisRateLimiter } from "@/lib/rate-limiter";
import { getAdminDb } from "@/lib/firebase/admin";

// KIS API 기본 URL
const KIS_API_BASE_URL = {
    prod: "https://openapi.koreainvestment.com:9443", // 실전투자
    vts: "https://openapivts.koreainvestment.com:29443", // 모의투자
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

// 서버 메모리에 토큰 캐싱 (Cloud Run에서는 Firestore로 대체)
// 하지만 빈번한 Firestore 읽기를 줄이기 위해 메모리 캐시도 병행 사용 (Short TTL)
const memoryTokenCache = new Map<KisEnvironment, AccessToken>();

export class ServerKisService {
    // 토큰 갱신 중복 요청 방지를 위한 환경별 Promise Map
    private static tokenRefreshPromises = new Map<KisEnvironment, Promise<string>>();

    // 토큰 만료 전 갱신 마진 (5분)
    private static readonly TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

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

        return {
            environment,
            config: activeConfig
        };
    }

    private static getBaseUrl(env: KisEnvironment): string {
        return KIS_API_BASE_URL[env];
    }

    /**
     * 액세스 토큰 발급 또는 조회
     * - forceRefresh가 true이면 기존 캐시 및 Firestore를 무시하고 새로 발급
     */
    /**
     * 액세스 토큰 발급 또는 조회
     * - forceRefresh가 true이면 기존 캐시 및 Firestore를 무시하고 새로 발급
     */
    static async getAccessToken(forceRefresh = false): Promise<string> {
        const { environment: env, config } = this.getConfig();
        const now = Date.now();
        const docId = `kis_token_${env}`;

        // 강제 갱신 요청 시 메모리 캐시부터 비움
        if (forceRefresh) {
            memoryTokenCache.delete(env);
            console.log(`[KIS Server] ${env} 토큰 강제 갱신 시작... (메모리 캐시 초기화)`);
        } else {
            // 1. 메모리 캐시 확인
            const memToken = memoryTokenCache.get(env);
            if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                return memToken.accessToken;
            }
        }

        // 2. Firestore 확인 (forceRefresh가 아닐 때만)
        if (!forceRefresh) {
            try {
                const db = getAdminDb();
                const docRef = db.collection('system_metadata').doc(docId);
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
                console.warn(`[KIS Server] ${env} Firestore 토큰 조회 실패 (메모리 모드로 계속):`, error instanceof Error ? error.message : error);
                // Firestore 실패 시에도 프로세스 중단 방지
            }
        }

        // 3. 토큰 재발급 (동시 요청 방지)
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise && !forceRefresh) {
            return existingPromise;
        }

        const refreshPromise = (async () => {
            try {
                // 분산 락 로직 (Firestore가 정상일 때만 작동)
                if (!forceRefresh) {
                    try {
                        const db = getAdminDb();
                        const lockRef = db.collection('system_metadata').doc(`kis_token_lock_${env}`);
                        const lockDoc = await lockRef.get();

                        if (lockDoc.exists) {
                            const lockData = lockDoc.data();
                            const lockTime = lockData?.timestamp?.toDate ? lockData.timestamp.toDate().getTime() : lockData?.timestamp;

                            // 30초 이내의 락이 있으면 다른 인스턴스가 작업 중인 것으로 판단
                            if (lockTime && (now - lockTime < 30000)) {
                                console.log(`[KIS Server] ${env} 다른 인스턴스에서 토큰 발급 중... (락 감지)`);

                                // 최대 5초 대기하며 Firestore에서 새 토큰 확인 (폴링 방식)
                                for (let i = 0; i < 10; i++) {
                                    await new Promise(r => setTimeout(r, 500));
                                    const checkDoc = await db.collection('system_metadata').doc(docId).get();
                                    const checkData = checkDoc.data();
                                    if (checkDoc.exists && checkData) {
                                        const checkExpiresAt = checkData.expiresAt?.toDate ? checkData.expiresAt.toDate() : new Date(checkData.expiresAt);
                                        // 유효한 토큰이 이미 발급되었는지 확인
                                        if (checkExpiresAt && Date.now() < checkExpiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                                            console.log(`[KIS Server] ${env} 다른 인스턴스가 발급한 최신 토큰 확인 완료`);
                                            // 메모리 캐시도 업데이트 후 반환
                                            const newToken: AccessToken = {
                                                accessToken: checkData.accessToken,
                                                tokenType: checkData.tokenType,
                                                expiresIn: checkData.expiresIn,
                                                expiresAt: checkExpiresAt
                                            };
                                            memoryTokenCache.set(env, newToken);
                                            return checkData.accessToken;
                                        }
                                    }
                                }
                                console.log(`[KIS Server] ${env} 토큰 발급 대기 시간 초과, 직접 발급 시도`);
                            }
                        }

                        // 락 설정 (현재 인스턴스가 발급 주체가 됨)
                        await lockRef.set({ fetching: true, timestamp: new Date(), pid: process.pid }).catch(() => { });
                    } catch (e) {
                        // Firestore 접근 불가 시 락 생략하고 진행
                    }
                }

                // 실제 토큰 발급
                const token = await this.fetchNewToken(env, config);

                // 락 해제 시도
                try {
                    const db = getAdminDb();
                    await db.collection('system_metadata').doc(`kis_token_lock_${env}`).delete().catch(() => { });
                } catch (e) { }

                return token;
            } catch (err) {
                console.error(`[KIS Server] ${env} 토큰 발급 프로세스 치명적 오류:`, err);
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

    /**
     * 새로운 액세스 토큰 발급 및 Firestore 저장
     */
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

                // Firestore 저장 (비동기로 시도)
                getAdminDb().collection('system_metadata').doc(`kis_token_${env}`).set({
                    ...token,
                    updatedAt: new Date()
                }).catch((e: any) => console.warn('[KIS Server] Firestore 토큰 업데이트 권장되지만 실패함:', e.message));

                // 메모리 저장 (가장 확실함)
                memoryTokenCache.set(env, token);
                return token.accessToken;
            }
            return "";
        } catch (error) {
            console.error("[KIS Server] 토큰 발급 예외:", error);
            return "";
        }
    }

    /**
     * API 호출 공통 메서드
     */
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

        // 1. Rate Limiter 내부에서는 순수한 호출만 수행
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

        // 2. 결과 분석 및 재시도 (Rate Limiter 바깥 - 데드락 방지)
        if (data && data.rt_cd !== "0") {
            // 토큰 만료 에러
            if (data.msg1?.includes("기간이 만료된 token") || data.msg_cd === "EGW00123") {
                if (!isRetry) {
                    console.warn(`[KIS Server] 토큰 만료 에러 감지 (${path}): 갱신 후 재시도 수행`);
                    await this.getAccessToken(true); // 강제 갱신
                    return await this.callApi(path, trId, params, method, true);
                }
            }

            // 시세 호출 한도 초과 등 기타 오류 로그
            if (data.msg1?.includes("초당 거래건수")) return null;
            console.error(`[KIS Server] API 오류 (${path}): ${data.msg1}`);
        }

        return data;
    }

    /**
     * 지수 정보 조회 (KOSPI, KOSDAQ, NASDAQ, DOW)
     * 사용자 요청에 따라 현재는 API 호출 없이 '데이터 없음' 처리
     */
    static async getIndices(): Promise<{ indices: any[], isMarketOpen: boolean }> {
        const indices = ["KOSPI", "KOSDAQ", "NASDAQ", "DOW"];
        return {
            indices: indices.map(id => ({ name: id, error: "No data" })),
            isMarketOpen: false
        };
    }

    /**
     * 배치 주가 정보 조회 (중앙 집중형 Request Queue 사용)
     */
    static async getPrices(symbols: string[]): Promise<Record<string, any>> {
        // 순환 참조 방지를 위해 동적 import
        const { kisRequestQueue } = await import("./kis-request-queue");
        return kisRequestQueue.getPrices(symbols);
    }
}
