/**
 * 주가 데이터 타입
 */
export interface PriceData {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    timestamp: Date;
}

/**
 * 캔들 데이터 타입
 */
export interface CandleData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * 기간 타입
 */
export type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y";

/**
 * 주가 데이터 서비스
 * 실시간 주가 및 과거 데이터를 제공합니다.
 */
export class PriceService {
    private baseUrl: string;

    constructor() {
        // 초기에는 토스증권 크롤링 또는 한국투자증권 API 사용
        this.baseUrl = process.env.NEXT_PUBLIC_KIS_API_URL || "";
    }

    /**
     * 현재 주가 조회 (모의 데이터)
     */
    async getCurrentPrice(stockCode: string): Promise<PriceData> {
        // 실제로는 API나 크롤링을 통해 데이터를 가져옴
        // 여기서는 모의 데이터 반환
        const mockData: Record<string, PriceData> = {
            "005930": {
                stockCode: "005930",
                stockName: "삼성전자",
                currentPrice: 78000,
                previousClose: 77500,
                change: 500,
                changePercent: 0.65,
                open: 77800,
                high: 78500,
                low: 77200,
                volume: 12500000,
                timestamp: new Date(),
            },
            "035720": {
                stockCode: "035720",
                stockName: "카카오",
                currentPrice: 42000,
                previousClose: 43000,
                change: -1000,
                changePercent: -2.33,
                open: 42800,
                high: 43200,
                low: 41500,
                volume: 3200000,
                timestamp: new Date(),
            },
        };

        return mockData[stockCode] || this.generateMockPrice(stockCode);
    }

    /**
     * 과거 주가 데이터 조회 (모의 데이터)
     */
    async getHistoricalPrices(stockCode: string, period: Period): Promise<CandleData[]> {
        const days = this.getPeriodDays(period);
        const candles: CandleData[] = [];
        const basePrice = 70000;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const volatility = Math.random() * 2000 - 1000;
            const open = basePrice + volatility + (days - i) * 50;
            const close = open + (Math.random() * 1000 - 500);

            candles.push({
                date: date.toISOString().split("T")[0],
                open: Math.round(open),
                high: Math.round(Math.max(open, close) + Math.random() * 500),
                low: Math.round(Math.min(open, close) - Math.random() * 500),
                close: Math.round(close),
                volume: Math.floor(Math.random() * 10000000) + 1000000,
            });
        }

        return candles;
    }

    /**
     * 실시간 주가 구독 (WebSocket)
     */
    subscribeToPrice(
        stockCode: string,
        callback: (price: number) => void
    ): () => void {
        // 실제로는 WebSocket 연결
        // 여기서는 모의 interval
        const interval = setInterval(() => {
            const randomChange = Math.random() * 200 - 100;
            callback(78000 + randomChange);
        }, 5000);

        return () => clearInterval(interval);
    }

    private getPeriodDays(period: Period): number {
        const periodMap: Record<Period, number> = {
            "1D": 1,
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "6M": 180,
            "1Y": 365,
            "3Y": 1095,
            "5Y": 1825,
        };
        return periodMap[period];
    }

    private generateMockPrice(stockCode: string): PriceData {
        const basePrice = 50000 + Math.random() * 50000;
        const change = (Math.random() * 2000) - 1000;

        return {
            stockCode,
            stockName: `종목 ${stockCode}`,
            currentPrice: Math.round(basePrice),
            previousClose: Math.round(basePrice - change),
            change: Math.round(change),
            changePercent: Number((change / basePrice * 100).toFixed(2)),
            open: Math.round(basePrice - Math.random() * 500),
            high: Math.round(basePrice + Math.random() * 1000),
            low: Math.round(basePrice - Math.random() * 1000),
            volume: Math.floor(Math.random() * 10000000),
            timestamp: new Date(),
        };
    }
}

export const priceService = new PriceService();
