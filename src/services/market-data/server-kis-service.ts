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

    /**
     * 시장 지수 조회 (KOSPI, KOSDAQ, NASDAQ, DOW)
     * 
     * - Firestore 캐싱을 통해 반복 API 호출 방지
     * - 장중: 1분 캐시, 장마감: 12시간 캐시
     * - 장마감/주말에는 마지막 거래일 데이터 표시
     */
    static async getIndices(): Promise<{ indices: any[], isMarketOpen: boolean }> {
        const CACHE_DOC_ID = 'market_indices';
        const CACHE_TTL_MARKET_OPEN = 60 * 1000;        // 장중: 1분
        const CACHE_TTL_MARKET_CLOSED = 12 * 60 * 60 * 1000; // 장마감: 12시간

        // 1. 장 운영 상태 확인
        const { koMarketOpen, usMarketOpen } = this.checkMarketStatus();
        const isAnyMarketOpen = koMarketOpen || usMarketOpen;
        const cacheTTL = isAnyMarketOpen ? CACHE_TTL_MARKET_OPEN : CACHE_TTL_MARKET_CLOSED;

        // 2. Firestore 캐시 확인
        try {
            const cached = await getDocument('system_metadata', CACHE_DOC_ID);
            if (cached?.indices && cached?.updatedAt) {
                const updatedAt = new Date(cached.updatedAt).getTime();
                const now = Date.now();
                if (now - updatedAt < cacheTTL) {
                    console.log(`[KIS Index] 캐시 사용 (${Math.round((now - updatedAt) / 1000)}초 전)`);
                    return {
                        indices: cached.indices,
                        isMarketOpen: isAnyMarketOpen
                    };
                }
            }
        } catch (e) {
            console.warn('[KIS Index] 캐시 조회 실패:', e);
        }

        // 3. API에서 새 데이터 가져오기
        console.log('[KIS Index] API에서 새 데이터 조회');
        const indices: any[] = [];

        // 국내 지수 (KOSPI, KOSDAQ)
        const domesticIndices = await this.fetchDomesticIndices();
        indices.push(...domesticIndices);

        // 해외 지수 (NASDAQ, DOW)
        const overseasIndices = await this.fetchOverseasIndices();
        indices.push(...overseasIndices);

        // 4. 캐시 저장
        try {
            await setDocument('system_metadata', CACHE_DOC_ID, {
                indices,
                updatedAt: new Date(),
                koMarketOpen,
                usMarketOpen
            });
            console.log('[KIS Index] 캐시 저장 완료');
        } catch (e) {
            console.warn('[KIS Index] 캐시 저장 실패:', e);
        }

        return { indices, isMarketOpen: isAnyMarketOpen };
    }

    /**
     * 장 운영 상태 확인
     * - 한국장: 평일 09:00-15:30 KST
     * - 미국장: 평일 09:30-16:00 EST (한국시간 23:30-06:00 다음날)
     */
    private static checkMarketStatus(): { koMarketOpen: boolean; usMarketOpen: boolean } {
        const now = new Date();

        // 한국 시간 기준
        const koFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            weekday: 'short'
        });
        const koParts = koFormatter.formatToParts(now);
        const koWeekday = koParts.find(p => p.type === 'weekday')?.value || '';
        const koHour = parseInt(koParts.find(p => p.type === 'hour')?.value || '0');
        const koMinute = parseInt(koParts.find(p => p.type === 'minute')?.value || '0');
        const koTime = koHour * 60 + koMinute;

        // 한국장: 평일 09:00-15:30 (540-930분)
        const koWeekend = ['Sat', 'Sun'].includes(koWeekday);
        const koMarketOpen = !koWeekend && koTime >= 540 && koTime <= 930;

        // 미국 시간 기준 (EST)
        const usFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            weekday: 'short'
        });
        const usParts = usFormatter.formatToParts(now);
        const usWeekday = usParts.find(p => p.type === 'weekday')?.value || '';
        const usHour = parseInt(usParts.find(p => p.type === 'hour')?.value || '0');
        const usMinute = parseInt(usParts.find(p => p.type === 'minute')?.value || '0');
        const usTime = usHour * 60 + usMinute;

        // 미국장: 평일 09:30-16:00 (570-960분)
        const usWeekend = ['Sat', 'Sun'].includes(usWeekday);
        const usMarketOpen = !usWeekend && usTime >= 570 && usTime <= 960;

        return { koMarketOpen, usMarketOpen };
    }

    /**
     * 국내 지수 조회 (KOSPI, KOSDAQ)
     * API: /uapi/domestic-stock/v1/quotations/inquire-index-price
     * tr_id: FHPUP02100000
     */
    private static async fetchDomesticIndices(): Promise<any[]> {
        const indexCodes = [
            { code: '0001', name: 'KOSPI' },
            { code: '1001', name: 'KOSDAQ' }
        ];

        const results: any[] = [];

        for (const { code, name } of indexCodes) {
            try {
                const data = await this.callApi(
                    '/uapi/domestic-stock/v1/quotations/inquire-index-price',
                    'FHPUP02100000',
                    {
                        FID_COND_MRKT_DIV_CODE: 'U',
                        FID_INPUT_ISCD: code
                    }
                );

                if (data?.output) {
                    const o = data.output;
                    const price = parseFloat(o.bstp_nmix_prpr || o.ovrs_nmix_prpr || '0');
                    const change = parseFloat(o.bstp_nmix_prdy_vrss || o.ovrs_nmix_prdy_vrss || '0');
                    const changeRate = parseFloat(o.bstp_nmix_prdy_ctrt || o.prdy_ctrt || '0');

                    results.push({
                        name,
                        price,
                        change,
                        changeRate,
                        isUp: change > 0,
                        isDown: change < 0
                    });
                } else {
                    results.push({ name, price: 0, change: 0, changeRate: 0, isUp: false, isDown: false, error: 'No data' });
                }
            } catch (e) {
                console.error(`[KIS Index] ${name} 조회 실패:`, e);
                results.push({ name, price: 0, change: 0, changeRate: 0, isUp: false, isDown: false, error: 'API Error' });
            }
        }

        return results;
    }

    /**
     * 해외 지수 조회 (NASDAQ, DOW)
     * 
     * KIS API(VTS)에서 해외 지수가 제한되는 경우 Yahoo Finance 폴백 사용
     */
    private static async fetchOverseasIndices(): Promise<any[]> {
        // Yahoo Finance API 심볼
        const yahooSymbols = [
            { symbol: '^IXIC', name: 'NASDAQ' },
            { symbol: '^DJI', name: 'DOW' }
        ];

        const results: any[] = [];

        for (const { symbol, name } of yahooSymbols) {
            try {
                // Yahoo Finance Chart API (무료, 인증 불필요)
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        },
                        cache: 'no-store'
                    }
                );

                if (!response.ok) {
                    throw new Error(`Yahoo API error: ${response.status}`);
                }

                const data = await response.json();
                const result = data.chart?.result?.[0];

                if (result) {
                    const meta = result.meta;
                    const price = meta.regularMarketPrice || 0;
                    const prevClose = meta.previousClose || meta.chartPreviousClose || price;
                    const change = price - prevClose;
                    const changeRate = prevClose > 0 ? (change / prevClose) * 100 : 0;

                    results.push({
                        name,
                        price: parseFloat(price.toFixed(2)),
                        change: parseFloat(change.toFixed(2)),
                        changeRate: parseFloat(changeRate.toFixed(2)),
                        isUp: change > 0,
                        isDown: change < 0
                    });
                    console.log(`[Yahoo Finance] ${name}: ${price.toFixed(2)} (${changeRate > 0 ? '+' : ''}${changeRate.toFixed(2)}%)`);
                } else {
                    throw new Error('No data in response');
                }
            } catch (e) {
                console.error(`[Yahoo Finance] ${name} 조회 실패:`, e);
                results.push({ name, price: 0, change: 0, changeRate: 0, isUp: false, isDown: false, error: 'API Error' });
            }
        }

        return results;
    }

    /**
     * 날짜 문자열 생성 (YYYYMMDD 형식)
     * @param daysOffset - 오늘 기준 일수 차이 (0=오늘, -7=7일 전)
     */
    private static getDateString(daysOffset: number): string {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    }
}





