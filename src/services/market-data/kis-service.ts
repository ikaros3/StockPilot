/**
 * 한국투자증권 KIS OpenAPI 서비스
 * 
 * API 문서: https://apiportal.koreainvestment.com
 * 
 * 제공 데이터:
 * - 실시간/현재가 조회
 * - 일별/분별 시세 조회
 * - 호가 조회
 * - 계좌 잔고 조회
 * - 주문 (매수/매도)
 * 
 * 인증 방식: OAuth 2.0 (Client Credentials)
 * 토큰 유효기간: 24시간 (6시간마다 갱신 권장)
 * 
 * Rate Limiting:
 * - 초당 20건, 분당 1000건 제한
 * - Rate Limiter를 통해 자동 조절
 * 
 * 환경 설정:
 * - prod: 실전투자 (실제 주문 가능)
 * - vts: 모의투자 (테스트용)
 */

import { kisRateLimiter, withRetry } from "@/lib/rate-limiter";

// KIS API 기본 URL
const KIS_API_BASE_URL = {
    prod: "https://openapi.koreainvestment.com:9443", // 실전투자
    vts: "https://openapivts.koreainvestment.com:29443", // 모의투자
};

// 환경 타입
type KisEnvironment = "prod" | "vts";

// 환경별 설정 구조
interface KisEnvConfig {
    appKey: string;
    appSecret: string;
    accountNumber: string;
}

// 환경 변수에서 설정 로드 (두 환경 모두 지원)
export const getConfig = () => {
    const environment = (process.env.KIS_ENVIRONMENT || "vts") as KisEnvironment;

    // 실전투자 설정
    const prodConfig: KisEnvConfig = {
        appKey: process.env.KIS_PROD_APP_KEY || "",
        appSecret: process.env.KIS_PROD_APP_SECRET || "",
        accountNumber: process.env.KIS_PROD_ACCOUNT_NUMBER || "",
    };

    // 모의투자 설정
    const vtsConfig: KisEnvConfig = {
        appKey: process.env.KIS_VTS_APP_KEY || "",
        appSecret: process.env.KIS_VTS_APP_SECRET || "",
        accountNumber: process.env.KIS_VTS_ACCOUNT_NUMBER || "",
    };

    // 현재 활성 환경의 설정
    const activeConfig = environment === "prod" ? prodConfig : vtsConfig;

    return {
        environment,
        prodConfig,
        vtsConfig,
        activeConfig,
        // 활성 환경의 설정을 기본값으로 사용
        appKey: activeConfig.appKey,
        appSecret: activeConfig.appSecret,
        accountNumber: activeConfig.accountNumber,
    };
};

// =============================================================================
// 타입 정의
// =============================================================================

/** 액세스 토큰 */
interface AccessToken {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: Date;
}

/** 현재가 정보 */
export interface CurrentPrice {
    stockCode: string;        // 종목코드
    stockName: string;        // 종목명
    currentPrice: number;     // 현재가
    changePrice: number;      // 전일 대비
    changeRate: number;       // 등락률 (%)
    openPrice: number;        // 시가
    highPrice: number;        // 고가
    lowPrice: number;         // 저가
    volume: number;           // 거래량
    tradingValue: number;     // 거래대금
    marketCap: number;        // 시가총액
    per: number;              // PER
    pbr: number;              // PBR
    eps: number;              // EPS
    bps: number;              // BPS
    yearHighPrice: number;    // 52주 최고가
    yearLowPrice: number;     // 52주 최저가
}

/** 일별 시세 */
export interface DailyPrice {
    date: string;             // 날짜 (YYYYMMDD)
    openPrice: number;        // 시가
    highPrice: number;        // 고가
    lowPrice: number;         // 저가
    closePrice: number;       // 종가
    volume: number;           // 거래량
    tradingValue: number;     // 거래대금
    changeRate: number;       // 등락률
}

/** 호가 정보 */
export interface OrderBook {
    stockCode: string;        // 종목코드
    timestamp: string;        // 호가 시간
    askPrices: number[];      // 매도호가 (1~10호가)
    askVolumes: number[];     // 매도잔량
    bidPrices: number[];      // 매수호가 (1~10호가)
    bidVolumes: number[];     // 매수잔량
    totalAskVolume: number;   // 총 매도잔량
    totalBidVolume: number;   // 총 매수잔량
}

/** 계좌 잔고 */
export interface AccountBalance {
    totalDeposit: number;           // 예수금
    totalPurchaseAmount: number;    // 총 매입금액
    totalEvaluationAmount: number;  // 총 평가금액
    totalProfitLoss: number;        // 총 손익금액
    totalProfitLossRate: number;    // 총 손익률 (%)
    holdings: AccountHolding[];     // 보유 종목 목록
}

/** 계좌 보유 종목 */
export interface AccountHolding {
    stockCode: string;              // 종목코드
    stockName: string;              // 종목명
    quantity: number;               // 보유수량
    purchasePrice: number;          // 매입가
    currentPrice: number;           // 현재가
    evaluationAmount: number;       // 평가금액
    profitLoss: number;             // 손익금액
    profitLossRate: number;         // 손익률 (%)
}

/** 주문 결과 */
export interface OrderResult {
    success: boolean;               // 주문 성공 여부
    orderNumber: string;            // 주문번호
    stockCode: string;              // 종목코드
    orderType: "buy" | "sell";      // 주문유형
    quantity: number;               // 주문수량
    price: number;                  // 주문가격
    message: string;                // 결과 메시지
}

// =============================================================================
// KIS OpenAPI 서비스 클래스
// =============================================================================

export class KisService {
    private accessTokens: Map<KisEnvironment, AccessToken> = new Map();
    private _currentEnvironment: KisEnvironment | null = null;

    constructor() {
        // 생성자에서는 아무것도 하지 않음 (환경 변수 지연 로드)
    }

    /**
     * 환경 변수에서 설정을 동적으로 로드
     */
    private getConfig() {
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

        return { environment, prodConfig, vtsConfig };
    }

    /**
     * 현재 환경 조회
     */
    getEnvironment(): KisEnvironment {
        if (!this._currentEnvironment) {
            this._currentEnvironment = this.getConfig().environment;
        }
        return this._currentEnvironment;
    }

    /**
     * 환경 전환 (실전/모의)
     */
    setEnvironment(env: KisEnvironment): void {
        this._currentEnvironment = env;
        console.log(`[KIS] 환경 전환: ${env === "prod" ? "실전투자" : "모의투자"}`);
    }

    /**
     * 현재 환경의 설정 반환
     */
    private getActiveConfig(): KisEnvConfig {
        const config = this.getConfig();
        return this.getEnvironment() === "prod"
            ? config.prodConfig
            : config.vtsConfig;
    }

    /**
     * API 키 설정 여부 확인
     */
    isConfigured(env?: KisEnvironment): boolean {
        const cfg = this.getConfig();
        const envConfig = env
            ? env === "prod"
                ? cfg.prodConfig
                : cfg.vtsConfig
            : this.getActiveConfig();
        return !!(envConfig.appKey && envConfig.appSecret);
    }

    /**
     * 두 환경 모두 설정되었는지 확인
     */
    isBothEnvironmentsConfigured(): boolean {
        return this.isConfigured("prod") && this.isConfigured("vts");
    }

    /**
     * 기본 URL 반환
     */
    private getBaseUrl(): string {
        return KIS_API_BASE_URL[this.getEnvironment()];
    }

    /**
     * 액세스 토큰 발급
     */
    private async getAccessToken(): Promise<string> {
        const env = this.getEnvironment();
        // 이미 유효한 토큰이 있으면 재사용
        const cachedToken = this.accessTokens.get(env);
        if (cachedToken && new Date() < cachedToken.expiresAt) {
            return cachedToken.accessToken;
        }

        const config = this.getActiveConfig();
        if (!config.appKey || !config.appSecret) {
            console.warn(`[KIS] ${env} 환경 API 키가 설정되지 않았습니다.`);
            return "";
        }

        try {
            console.log(`[KIS] ${env} 환경 토큰 발급 중...`);

            const response = await fetch(`${this.getBaseUrl()}/oauth2/tokenP`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grant_type: "client_credentials",
                    appkey: config.appKey,
                    appsecret: config.appSecret,
                }),
            });

            const data = await response.json();

            if (data.access_token) {
                const token: AccessToken = {
                    accessToken: data.access_token,
                    tokenType: data.token_type,
                    expiresIn: data.expires_in,
                    expiresAt: new Date(Date.now() + data.expires_in * 1000),
                };
                this.accessTokens.set(env, token);
                console.log(`[KIS] ${env} 토큰 발급 성공`);
                return token.accessToken;
            }

            console.error(`[KIS] 토큰 발급 실패: ${data.msg1}`);
            return "";
        } catch (error) {
            console.error("[KIS] 토큰 발급 오류:", error);
            return "";
        }
    }

    /**
     * API 호출 헬퍼
     */
    private async callApi<T>(
        path: string,
        trId: string,
        params: Record<string, string> = {},
        method: "GET" | "POST" = "GET"
    ): Promise<T | null> {
        const token = await this.getAccessToken();
        const config = this.getActiveConfig();

        if (!token) {
            return null;
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json; charset=utf-8",
            authorization: `Bearer ${token}`,
            appkey: config.appKey,
            appsecret: config.appSecret,
            tr_id: trId,
        };

        try {
            // Rate Limiter를 통해 API 호출
            const result = await kisRateLimiter.execute(async () => {
                return await withRetry(async () => {
                    let response: Response;

                    if (method === "GET") {
                        const queryString = new URLSearchParams(params).toString();
                        response = await fetch(`${this.getBaseUrl()}${path}?${queryString}`, {
                            method: "GET",
                            headers,
                        });
                    } else {
                        response = await fetch(`${this.getBaseUrl()}${path}`, {
                            method: "POST",
                            headers,
                            body: JSON.stringify(params),
                        });
                    }

                    const data = await response.json();

                    if (data.rt_cd !== "0") {
                        // Rate limit 오류인 경우 재시도
                        if (data.msg1?.includes("초당 거래건수")) {
                            throw new Error(`Rate limit: ${data.msg1}`);
                        }
                        console.error(`[KIS] API 오류: ${data.msg1}`);
                        return null;
                    }

                    return data as T;
                }, {
                    maxRetries: 3,
                    baseDelayMs: 1000,
                });
            });

            return result;
        } catch (error) {
            console.error("[KIS] API 호출 오류:", error);
            return null;
        }
    }

    /**
     * 현재가 조회
     */
    async getCurrentPrice(stockCode: string): Promise<CurrentPrice> {
        if (!this.isConfigured()) {
            return this.getMockCurrentPrice(stockCode);
        }

        interface KisCurrentPriceResponse {
            output: {
                stck_shrn_iscd: string;
                stck_prpr: string;
                prdy_vrss: string;
                prdy_ctrt: string;
                stck_oprc: string;
                stck_hgpr: string;
                stck_lwpr: string;
                acml_vol: string;
                acml_tr_pbmn: string;
                hts_avls: string;
                per: string;
                pbr: string;
                eps: string;
                bps: string;
                w52_hgpr: string;
                w52_lwpr: string;
            };
        }

        const result = await this.callApi<KisCurrentPriceResponse>(
            "/uapi/domestic-stock/v1/quotations/inquire-price",
            "FHKST01010100",
            {
                FID_COND_MRKT_DIV_CODE: "J",
                FID_INPUT_ISCD: stockCode,
            }
        );

        if (!result?.output) {
            return this.getMockCurrentPrice(stockCode);
        }

        const o = result.output;
        return {
            stockCode,
            stockName: "",
            currentPrice: parseInt(o.stck_prpr, 10),
            changePrice: parseInt(o.prdy_vrss, 10),
            changeRate: parseFloat(o.prdy_ctrt),
            openPrice: parseInt(o.stck_oprc, 10),
            highPrice: parseInt(o.stck_hgpr, 10),
            lowPrice: parseInt(o.stck_lwpr, 10),
            volume: parseInt(o.acml_vol, 10),
            tradingValue: parseInt(o.acml_tr_pbmn, 10),
            marketCap: parseInt(o.hts_avls, 10) * 100000000,
            per: parseFloat(o.per),
            pbr: parseFloat(o.pbr),
            eps: parseFloat(o.eps),
            bps: parseFloat(o.bps),
            yearHighPrice: parseInt(o.w52_hgpr, 10),
            yearLowPrice: parseInt(o.w52_lwpr, 10),
        };
    }

    /**
     * 일별 시세 조회
     */
    /**
     * 일별 시세 조회
     */
    async getDailyPrices(
        stockCode: string,
        startDate?: string,
        endDate?: string,
        period: "D" | "W" | "M" = "D"
    ): Promise<DailyPrice[]> {
        // 프록시 API 호출
        try {
            // 쿼리 파라미터 구성
            const params = new URLSearchParams({
                symbol: stockCode,
                period,
            });

            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const response = await fetch(`/api/kis/daily-price?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Proxy API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.dailyPrices) {
                return data.dailyPrices;
            }

            // 데이터가 없거나 에러인 경우 Mock으로 fallback (선택적)
            console.warn("[Client] Daily price fetch failed, falling back to mock");
            return this.getMockDailyPrices(stockCode);

        } catch (error) {
            console.error("[Client] Failed to fetch daily prices via proxy:", error);
            return this.getMockDailyPrices(stockCode);
        }
    }

    /**
     * 호가 조회
     */
    async getOrderBook(stockCode: string): Promise<OrderBook> {
        if (!this.isConfigured()) {
            return this.getMockOrderBook(stockCode);
        }

        interface KisOrderBookResponse {
            output1: {
                aspr_acpt_hour: string;
                askp1: string; askp2: string; askp3: string; askp4: string; askp5: string;
                askp6: string; askp7: string; askp8: string; askp9: string; askp10: string;
                askp_rsqn1: string; askp_rsqn2: string; askp_rsqn3: string; askp_rsqn4: string; askp_rsqn5: string;
                askp_rsqn6: string; askp_rsqn7: string; askp_rsqn8: string; askp_rsqn9: string; askp_rsqn10: string;
                bidp1: string; bidp2: string; bidp3: string; bidp4: string; bidp5: string;
                bidp6: string; bidp7: string; bidp8: string; bidp9: string; bidp10: string;
                bidp_rsqn1: string; bidp_rsqn2: string; bidp_rsqn3: string; bidp_rsqn4: string; bidp_rsqn5: string;
                bidp_rsqn6: string; bidp_rsqn7: string; bidp_rsqn8: string; bidp_rsqn9: string; bidp_rsqn10: string;
                total_askp_rsqn: string;
                total_bidp_rsqn: string;
            };
        }

        const result = await this.callApi<KisOrderBookResponse>(
            "/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn",
            "FHKST01010200",
            {
                FID_COND_MRKT_DIV_CODE: "J",
                FID_INPUT_ISCD: stockCode,
            }
        );

        if (!result?.output1) {
            return this.getMockOrderBook(stockCode);
        }

        const o = result.output1;
        return {
            stockCode,
            timestamp: o.aspr_acpt_hour,
            askPrices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                parseInt(o[`askp${i}` as keyof typeof o] as string, 10)
            ),
            askVolumes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                parseInt(o[`askp_rsqn${i}` as keyof typeof o] as string, 10)
            ),
            bidPrices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                parseInt(o[`bidp${i}` as keyof typeof o] as string, 10)
            ),
            bidVolumes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                parseInt(o[`bidp_rsqn${i}` as keyof typeof o] as string, 10)
            ),
            totalAskVolume: parseInt(o.total_askp_rsqn, 10),
            totalBidVolume: parseInt(o.total_bidp_rsqn, 10),
        };
    }

    /**
     * 계좌 잔고 조회
     */
    /**
     * 계좌 잔고 조회
     */
    async getAccountBalance(): Promise<AccountBalance | null> {
        try {
            const response = await fetch("/api/kis/balance");

            if (!response.ok) {
                throw new Error(`Proxy API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.balance) {
                return data.balance;
            }

            console.warn("[Client] Account balance fetch failed, falling back to mock");
            return this.getMockAccountBalance();

        } catch (error) {
            console.error("[Client] Failed to fetch account balance via proxy:", error);
            return this.getMockAccountBalance();
        }
    }

    /**
     * 주식 매수 주문
     */
    async buyStock(
        stockCode: string,
        quantity: number,
        price: number,
        orderType: "00" | "01" = "00"
    ): Promise<OrderResult> {
        return this.placeOrder(stockCode, quantity, price, "buy", orderType);
    }

    /**
     * 주식 매도 주문
     */
    async sellStock(
        stockCode: string,
        quantity: number,
        price: number,
        orderType: "00" | "01" = "00"
    ): Promise<OrderResult> {
        return this.placeOrder(stockCode, quantity, price, "sell", orderType);
    }

    /**
     * 주문 실행 (내부 메서드)
     */
    private async placeOrder(
        stockCode: string,
        quantity: number,
        price: number,
        side: "buy" | "sell",
        orderType: "00" | "01"
    ): Promise<OrderResult> {
        const config = this.getActiveConfig();

        if (!this.isConfigured() || !config.accountNumber) {
            return {
                success: false,
                orderNumber: "",
                stockCode,
                orderType: side,
                quantity,
                price,
                message: "KIS API 설정이 완료되지 않았습니다.",
            };
        }

        const [accountNum, accountProductCode] = config.accountNumber.split("-");
        const trId =
            this.getEnvironment() === "prod"
                ? side === "buy"
                    ? "TTTC0802U"
                    : "TTTC0801U"
                : side === "buy"
                    ? "VTTC0802U"
                    : "VTTC0801U";

        interface KisOrderResponse {
            rt_cd: string;
            msg1: string;
            output: {
                ODNO: string;
            };
        }

        const result = await this.callApi<KisOrderResponse>(
            "/uapi/domestic-stock/v1/trading/order-cash",
            trId,
            {
                CANO: accountNum,
                ACNT_PRDT_CD: accountProductCode || "01",
                PDNO: stockCode,
                ORD_DVSN: orderType,
                ORD_QTY: quantity.toString(),
                ORD_UNPR: price.toString(),
            },
            "POST"
        );

        if (!result) {
            return {
                success: false,
                orderNumber: "",
                stockCode,
                orderType: side,
                quantity,
                price,
                message: "주문 실행 중 오류가 발생했습니다.",
            };
        }

        return {
            success: result.rt_cd === "0",
            orderNumber: result.output?.ODNO || "",
            stockCode,
            orderType: side,
            quantity,
            price,
            message: result.msg1,
        };
    }

    // =============================================================================
    // 목 데이터 (API 키 미설정 시 사용)
    // =============================================================================

    private getMockCurrentPrice(stockCode: string): CurrentPrice {
        const mockData: Record<string, Partial<CurrentPrice>> = {
            "005930": {
                stockName: "삼성전자",
                currentPrice: 78000,
                changePrice: 1200,
                changeRate: 1.56,
                openPrice: 77200,
                highPrice: 78500,
                lowPrice: 77000,
                volume: 15234567,
                tradingValue: 1185000000000,
                marketCap: 465000000000000,
                per: 15.2,
                pbr: 1.3,
                eps: 5131,
                bps: 60000,
                yearHighPrice: 86000,
                yearLowPrice: 52000,
            },
            "035720": {
                stockName: "카카오",
                currentPrice: 42000,
                changePrice: -500,
                changeRate: -1.18,
                openPrice: 42500,
                highPrice: 43000,
                lowPrice: 41800,
                volume: 2345678,
                tradingValue: 98500000000,
                marketCap: 18500000000000,
                per: 35.5,
                pbr: 1.8,
                eps: 1183,
                bps: 23333,
                yearHighPrice: 65000,
                yearLowPrice: 35000,
            },
        };

        const data = mockData[stockCode] || {};

        return {
            stockCode,
            stockName: data.stockName || `종목 ${stockCode}`,
            currentPrice: data.currentPrice || 50000,
            changePrice: data.changePrice || 0,
            changeRate: data.changeRate || 0,
            openPrice: data.openPrice || 50000,
            highPrice: data.highPrice || 51000,
            lowPrice: data.lowPrice || 49000,
            volume: data.volume || 1000000,
            tradingValue: data.tradingValue || 50000000000,
            marketCap: data.marketCap || 100000000000000,
            per: data.per || 15,
            pbr: data.pbr || 1.5,
            eps: data.eps || 3333,
            bps: data.bps || 33333,
            yearHighPrice: data.yearHighPrice || 60000,
            yearLowPrice: data.yearLowPrice || 40000,
        };
    }

    private getMockDailyPrices(stockCode: string): DailyPrice[] {
        const basePrice = stockCode === "005930" ? 78000 : 50000;
        const prices: DailyPrice[] = [];
        const today = new Date();

        for (let i = 30; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const variance = (Math.random() - 0.5) * 0.04;
            const closePrice = Math.round(basePrice * (1 + variance));

            prices.push({
                date: date.toISOString().slice(0, 10).replace(/-/g, ""),
                openPrice: Math.round(closePrice * (1 + (Math.random() - 0.5) * 0.01)),
                highPrice: Math.round(closePrice * (1 + Math.random() * 0.02)),
                lowPrice: Math.round(closePrice * (1 - Math.random() * 0.02)),
                closePrice,
                volume: Math.round(10000000 + Math.random() * 10000000),
                tradingValue: Math.round(500000000000 + Math.random() * 500000000000),
                changeRate: variance * 100,
            });
        }

        return prices;
    }

    private getMockOrderBook(stockCode: string): OrderBook {
        const basePrice = stockCode === "005930" ? 78000 : 50000;

        return {
            stockCode,
            timestamp: new Date().toTimeString().slice(0, 8).replace(/:/g, ""),
            askPrices: Array.from({ length: 10 }, (_, i) => basePrice + (i + 1) * 100),
            askVolumes: Array.from({ length: 10 }, () => Math.round(1000 + Math.random() * 9000)),
            bidPrices: Array.from({ length: 10 }, (_, i) => basePrice - (i + 1) * 100),
            bidVolumes: Array.from({ length: 10 }, () => Math.round(1000 + Math.random() * 9000)),
            totalAskVolume: 150000,
            totalBidVolume: 180000,
        };
    }

    private getMockAccountBalance(): AccountBalance {
        return {
            totalDeposit: 5000000,
            totalPurchaseAmount: 10000000,
            totalEvaluationAmount: 12500000,
            totalProfitLoss: 2500000,
            totalProfitLossRate: 25.0,
            holdings: [
                {
                    stockCode: "005930",
                    stockName: "삼성전자",
                    quantity: 100,
                    purchasePrice: 65000,
                    currentPrice: 78000,
                    evaluationAmount: 7800000,
                    profitLoss: 1300000,
                    profitLossRate: 20.0,
                },
                {
                    stockCode: "035720",
                    stockName: "카카오",
                    quantity: 50,
                    purchasePrice: 38000,
                    currentPrice: 42000,
                    evaluationAmount: 2100000,
                    profitLoss: 200000,
                    profitLossRate: 10.53,
                },
            ],
        };
    }
}

// 싱글톤 인스턴스
export const kisService = new KisService();
