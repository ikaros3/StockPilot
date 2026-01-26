import { kisRateLimiter } from "@/lib/rate-limiter";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * ServerKisService
 * 
 * KIS Open API 서버사이드 서비스
 * - 토큰 캐싱: 메모리 + Firestore (분산 환경 지원)
 * - 중복 발급 방지: 쿨다운 + Promise 캐싱 + 분산 락
 * - Firestore 실패 시 메모리 캐시만으로 동작 (Graceful Degradation)
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

// 메모리 토큰 캐시
const memoryTokenCache = new Map<KisEnvironment, AccessToken>();

export class ServerKisService {
    private static tokenRefreshPromises = new Map<KisEnvironment, Promise<string>>();
    private static readonly TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5분 마진

    // SMS 폭탄 방지: 쿨다운 시간 (90초로 증가)
    private static lastIssuanceAttempt = 0;
    private static readonly ISSUANCE_COOLDOWN_MS = 90 * 1000;

    // Firestore 연결 상태 캐시
    private static firestoreAvailable: boolean | null = null;

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

    /**
     * Firestore 연결 가능 여부 확인 (캐싱됨)
     */
    private static async checkFirestoreAvailability(): Promise<boolean> {
        if (this.firestoreAvailable !== null) {
            return this.firestoreAvailable;
        }

        try {
            const db = await getAdminDb();
            await db.collection('system_metadata').doc('_health').get();
            this.firestoreAvailable = true;
            console.log('[KIS Server] Firestore 연결 확인됨');
        } catch (error) {
            this.firestoreAvailable = false;
            console.warn('[KIS Server] Firestore 연결 불가 - 메모리 캐시만 사용:', error);
        }

        return this.firestoreAvailable;
    }

    /**
     * 액세스 토큰 획득
     * 우선순위: 환경변수 고정 토큰 > 메모리 캐시 > Firestore 캐시 > 신규 발급
     */
    static async getAccessToken(forceRefresh = false): Promise<string> {
        const { environment: env, config } = this.getConfig();
        const now = Date.now();
        const docId = `kis_token_${env}`;

        // 1. 환경변수에 고정된 토큰이 있으면 우선 사용
        const pinnedToken = process.env.KIS_ACCESS_TOKEN;
        if (pinnedToken && !forceRefresh) {
            return pinnedToken;
        }

        // 2. 강제 갱신 시 메모리 캐시 삭제
        if (forceRefresh) {
            memoryTokenCache.delete(env);
        } else {
            // 3. 메모리 캐시 확인
            const memToken = memoryTokenCache.get(env);
            if (memToken && now < memToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
                return memToken.accessToken;
            }
        }

        // 4. Firestore 캐시 확인 (선택적)
        if (!forceRefresh && await this.checkFirestoreAvailability()) {
            try {
                const db = await getAdminDb();
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
                        console.log(`[KIS Server] Firestore 캐시에서 토큰 로드 (만료: ${expiresAt.toISOString()})`);
                        return token.accessToken;
                    }
                }
            } catch (error) {
                console.warn(`[KIS Server] Firestore 조회 실패:`, error);
            }
        }

        // 5. 동시 요청 방지: 이미 진행 중인 토큰 발급이 있으면 대기
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise && !forceRefresh) {
            console.log('[KIS Server] 기존 토큰 발급 요청 대기 중...');
            return existingPromise;
        }

        // 6. 새 토큰 발급 시작
        const refreshPromise = (async () => {
            try {
                // 쿨다운 체크 (SMS 폭탄 방지)
                const timeSinceLastIssuance = Date.now() - this.lastIssuanceAttempt;
                if (timeSinceLastIssuance < this.ISSUANCE_COOLDOWN_MS) {
                    const waitTime = Math.ceil((this.ISSUANCE_COOLDOWN_MS - timeSinceLastIssuance) / 1000);
                    console.warn(`[KIS Server] 토큰 발급 쿨다운 중... ${waitTime}초 후 재시도 가능`);

                    // 메모리 캐시에 만료된 토큰이라도 있으면 반환 (임시 사용)
                    const memToken = memoryTokenCache.get(env);
                    if (memToken) {
                        return memToken.accessToken;
                    }
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

    /**
     * 새 토큰 발급 및 저장
     */
    private static async fetchNewToken(env: KisEnvironment, config: KisEnvConfig): Promise<string> {
        if (!config.appKey || !config.appSecret) {
            console.error('[KIS Server] APP_KEY 또는 APP_SECRET이 설정되지 않음');
            return "";
        }

        try {
            console.log(`[KIS Server] 새 토큰 발급 요청 시작 (${env})`);

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

            if (!response.ok) {
                console.error(`[KIS Server] 토큰 발급 실패 - HTTP ${response.status}`);
                return "";
            }

            const data = await response.json();

            // 에러 응답 처리
            if (data.error_code) {
                console.error(`[KIS Server] 토큰 발급 에러: ${data.error_code} - ${data.error_description}`);
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

                // 메모리 캐시 저장 (항상)
                memoryTokenCache.set(env, token);
                console.log(`[KIS Server] 새 토큰 발급 완료 (만료: ${expiresAt.toISOString()})`);

                // Firestore 저장 (선택적)
                if (await this.checkFirestoreAvailability()) {
                    try {
                        const db = await getAdminDb();
                        await db.collection('system_metadata').doc(`kis_token_${env}`).set({
                            ...token,
                            updatedAt: new Date()
                        });
                        console.log('[KIS Server] Firestore에 토큰 캐싱 완료');
                    } catch (e) {
                        console.warn('[KIS Server] Firestore 캐싱 실패 (무시됨):', e);
                    }
                }

                return token.accessToken;
            }

            console.error('[KIS Server] 토큰 응답에 access_token 없음:', data);
            return "";
        } catch (error) {
            console.error('[KIS Server] 토큰 발급 네트워크 오류:', error);
            return "";
        }
    }

    /**
     * KIS API 호출
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

        if (!token) {
            throw new Error("토큰 없음 - API 호출 불가");
        }

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
                console.error('[KIS Server] API 호출 네트워크 오류:', err);
                return { rt_cd: "-1" };
            }
        });

        if (data && data.rt_cd !== "0") {
            // 토큰 만료 에러 시 1회 재시도
            if (data.msg_cd === "EGW00123" && !isRetry) {
                console.log('[KIS Server] 토큰 만료 - 갱신 후 재시도');
                await this.getAccessToken(true);
                return await this.callApi(path, trId, params, method, true);
            }
            // Rate Limit 에러는 null 반환
            if (data.msg1?.includes("초당 거래건수")) {
                console.warn('[KIS Server] Rate Limit 초과');
                return null;
            }
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
