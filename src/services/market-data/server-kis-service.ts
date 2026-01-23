import { kisRateLimiter } from "@/lib/rate-limiter";

// KIS API 기본 URL
const KIS_API_BASE_URL = {
    prod: "https://openapi.koreainvestment.com:9443", // 실전투자
    vts: "https://openapivts.koreainvestment.com:29443", // 모의투자
};

type KisEnvironment = "prod" | "vts";

interface KisEnvConfig {
    appKey: string;
    appSecret: string;
    accountNumber: string;
}

interface AccessToken {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: Date;
}

// 서버 메모리에 토큰 캐싱 (주의: 서버리스 환경에서는 인스턴스마다 다를 수 있음)
const tokenCache = new Map<KisEnvironment, AccessToken>();

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
     * - 동시 요청 시 기존 Promise 재사용
     * - 토큰 만료 5분 전 자동 재발급
     */
    static async getAccessToken(): Promise<string> {
        const { environment: env, config } = this.getConfig();

        // 캐시된 토큰 확인 (만료 5분 전까지 유효)
        const cachedToken = tokenCache.get(env);
        const now = Date.now();
        if (cachedToken && now < cachedToken.expiresAt.getTime() - this.TOKEN_REFRESH_MARGIN_MS) {
            return cachedToken.accessToken;
        }

        if (!config.appKey || !config.appSecret) {
            console.error(`[KIS Server] ${env} 환경 API 키가 설정되지 않았습니다.`);
            return "";
        }

        // 이미 토큰 발급 중이면 기존 Promise 재사용 (동시 요청 방지)
        const existingPromise = this.tokenRefreshPromises.get(env);
        if (existingPromise) {
            console.log(`[KIS Server] ${env} 토큰 발급 대기 중 (기존 요청 재사용)...`);
            return existingPromise;
        }

        // 새로운 토큰 발급 Promise 생성
        const refreshPromise = this.fetchNewToken(env, config);
        this.tokenRefreshPromises.set(env, refreshPromise);

        try {
            return await refreshPromise;
        } finally {
            // 완료 후 Promise 제거 (성공/실패 무관)
            this.tokenRefreshPromises.delete(env);
        }
    }

    /**
     * 새로운 액세스 토큰 발급 (내부 사용)
     */
    private static async fetchNewToken(env: KisEnvironment, config: KisEnvConfig): Promise<string> {
        try {
            console.log(`[KIS Server] ${env} 환경 토큰 발급 시도...`);
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
                const token: AccessToken = {
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    expiresAt: new Date(Date.now() + data.expires_in * 1000),
                };
                tokenCache.set(env, token);
                console.log(`[KIS Server] ${env} 토큰 발급 성공`);
                return token.accessToken;
            }

            console.error(`[KIS Server] 토큰 발급 실패: ${data.msg1}`);
            return "";
        } catch (error) {
            console.error("[KIS Server] 토큰 발급 오류:", error);
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
