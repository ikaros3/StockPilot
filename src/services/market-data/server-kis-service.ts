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
     * - Firestore를 우선 확인하여 서버 재시작 시에도 토큰 유지
     * - 메모리 캐시 병행 사용
     * - 다중 프로세스 환경에서도 중복 발급을 방지하기 위한 Distributed Lock 패턴 적용
     */
    static async getAccessToken(): Promise<string> {
        const { environment: env, config } = this.getConfig();
        const now = Date.now();

        // 1. 메모리 캐시 확인 (가장 빠름)
        const memToken = memoryTokenCache.get(env);
        if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
            return memToken.accessToken;
        }

        // 2. Firestore 확인 (영속성)
        const docId = `kis_token_${env}`;
        const db = getAdminDb();

        try {
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
                    // 메모리 캐시 업데이트
                    memoryTokenCache.set(env, token);
                    return token.accessToken;
                } else {
                    console.log(`[KIS Server] ${env} Firestore 토큰 만료됨 (만료예정: ${expiresAt?.toLocaleString()})`);
                }
            } else {
                console.log(`[KIS Server] ${env} Firestore 토큰 정보 없음`);
            }
        } catch (error) {
            console.error(`[KIS Server] ${env} Firestore 토큰 조회 실패:`, error);
        }

        // 3. 토큰 재발급 (동시 요청 방지)
        // 같은 프로세스(Worker) 내에서의 중복 요청 방지
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise) {
            console.log(`[KIS Server] ${env} 토큰 발급 대기 중 (인-메모리 큐 재사용)...`);
            return existingPromise;
        }

        // 다른 프로세스(다중 워커) 간의 중복 요청 방지 (Firestore Distributed Lock)
        const lockDocId = `kis_token_lock_${env}`;
        const lockRef = db.collection('system_metadata').doc(lockDocId);

        const refreshPromise = (async () => {
            try {
                // 락 획득 시도 (또는 기존 락 확인)
                const lockDoc = await lockRef.get();
                if (lockDoc.exists) {
                    const lockData = lockDoc.data();
                    const lockTime = lockData?.timestamp?.toDate ? lockData.timestamp.toDate().getTime() : lockData?.timestamp;

                    // 30초 이내의 락이 있으면 다른 프로세스가 작업 중인 것으로 판단
                    if (lockTime && (now - lockTime < 30000)) {
                        console.log(`[KIS Server] ${env} 다른 프로세스에서 토큰 발급 중... (락 감지)`);

                        // 최대 5초 대기하며 Firestore 확인
                        for (let i = 0; i < 5; i++) {
                            await new Promise(r => setTimeout(r, 1000));
                            const checkDoc = await db.collection('system_metadata').doc(docId).get();
                            if (checkDoc.exists) {
                                const checkData = checkDoc.data();
                                const checkExpiresAt = checkData?.expiresAt?.toDate ? checkData.expiresAt.toDate() : new Date(checkData?.expiresAt);
                                if (checkExpiresAt && Date.now() < checkExpiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                                    console.log(`[KIS Server] ${env} 다른 프로세스가 발급한 토큰 확인 완료`);
                                    return checkData?.accessToken;
                                }
                            }
                        }
                        console.log(`[KIS Server] ${env} 토큰 발급 대기 시간 초과, 직접 발급 시도`);
                    }
                }

                // 락 설정
                await lockRef.set({
                    fetching: true,
                    timestamp: new Date(),
                    processId: process.pid
                });

                // 실제 토큰 발급
                const token = await this.fetchNewToken(env, config);

                // 락 해제
                await lockRef.delete();

                return token;

            } catch (err) {
                console.error(`[KIS Server] ${env} 토큰 갱신 프로세스 오류:`, err);
                await lockRef.delete().catch(() => { });
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
        if (!config.appKey || !config.appSecret) {
            console.error(`[KIS Server] ${env} 환경 API 키가 설정되지 않았습니다.`);
            return "";
        }

        try {
            console.log(`[KIS Server] ${env} 환경 토큰 신규 발급 요청 (External API Call)...`);
            const response = await fetch(`${this.getBaseUrl(env)}/oauth2/tokenP`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grant_type: "client_credentials",
                    appkey: config.appKey,
                    appsecret: config.appSecret,
                }),
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[KIS Server] 토큰 발급 응답 오류 (${response.status}): ${errorText}`);
                return "";
            }

            const data = await response.json();

            if (data.access_token) {
                // KIS에서 주는 expires_in은 보통 초 단위 (86400 = 24h)
                const expiresAt = new Date(Date.now() + data.expires_in * 1000);
                const token: AccessToken = {
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    expiresAt: expiresAt,
                };

                // Firestore 저장
                try {
                    const docId = `kis_token_${env}`;
                    await getAdminDb().collection('system_metadata').doc(docId).set({
                        ...token,
                        updatedAt: new Date()
                    });
                    console.log(`[KIS Server] ${env} 토큰 Firestore 저장 완료`);
                } catch (e) {
                    console.error('[KIS Server] Firestore 토큰 저장 실패:', e);
                }

                // 메모리 저장
                memoryTokenCache.set(env, token);

                console.log(`[KIS Server] ${env} 토큰 발급 성공`);
                return token.accessToken;
            }

            console.error(`[KIS Server] 토큰 발급 실패: ${data.msg1}`);
            return "";
        } catch (error) {
            console.error("[KIS Server] 토큰 발급 중 예외 발생:", error);
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
        method: "GET" | "POST" = "GET"
    ) {
        const { environment: env, config } = this.getConfig();
        const token = await this.getAccessToken();

        if (!token) {
            throw new Error("Failed to get access token");
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json; charset=utf-8",
            authorization: `Bearer ${token}`,
            appkey: config.appKey,
            appsecret: config.appSecret,
            tr_id: trId,
            custtype: "P", // 개인
        };

        const baseUrl = this.getBaseUrl(env);

        // Rate Limiter 적용 (재시도 없음 - Rate Limit 오류 방지)
        return await kisRateLimiter.execute(async () => {
            let response: Response;

            if (method === "GET") {
                const queryString = new URLSearchParams(params).toString();
                response = await fetch(`${baseUrl}${path}?${queryString}`, {
                    method: "GET",
                    headers,
                    cache: 'no-store'
                });
            } else {
                response = await fetch(`${baseUrl}${path}`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(params),
                    cache: 'no-store'
                });
            }

            const data = await response.json();

            if (data.rt_cd !== "0") {
                // Rate Limit 오류는 재시도하지 않고 바로 에러 반환
                if (data.msg1?.includes("초당 거래건수")) {
                    console.warn(`[KIS Server] Rate Limit 도달 (${path}): ${data.msg1}`);
                    return null; // 재시도 없이 null 반환
                }
                console.error(`[KIS Server] API 응답 오류 (${path}): ${data.msg1}`);
            }

            return data;
        });
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
