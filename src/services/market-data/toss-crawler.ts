/**
 * 토스증권 크롤러
 * URL 패턴: https://www.tossinvest.com/stocks/[종목코드]/order
 * 
 * 주의: 토스증권 웹사이트는 CSR(Client-Side Rendering)이므로
 * 실제 크롤링 시에는 Puppeteer나 Playwright 같은 헤드리스 브라우저가 필요합니다.
 * 이 파일은 크롤링 인터페이스와 모의 구현을 제공합니다.
 */

export interface TossStockInfo {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    marketCap: number;
    foreignOwnership: number;
}

export interface TossChartData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TossOrderBook {
    asks: Array<{ price: number; quantity: number }>;
    bids: Array<{ price: number; quantity: number }>;
}

/**
 * 토스증권 크롤러 서비스
 */
export class TossCrawler {
    private baseUrl = "https://www.tossinvest.com/stocks";

    /**
     * 종목 정보 크롤링 (모의 구현)
     */
    async getStockInfo(stockCode: string): Promise<TossStockInfo> {
        // 실제로는 Puppeteer/Playwright로 페이지 로드 후 데이터 추출
        // 현재는 모의 데이터 반환
        console.log(`[TossCrawler] Fetching stock info for ${stockCode}`);
        console.log(`[TossCrawler] URL: ${this.baseUrl}/${stockCode}/order`);

        const mockData: Record<string, TossStockInfo> = {
            "005930": {
                stockCode: "005930",
                stockName: "삼성전자",
                currentPrice: 78000,
                previousClose: 77500,
                change: 500,
                changePercent: 0.65,
                high: 78500,
                low: 77200,
                volume: 12500000,
                marketCap: 465000000000000,
                foreignOwnership: 52.3,
            },
            "A122630": {
                stockCode: "122630",
                stockName: "KODEX 레버리지",
                currentPrice: 18500,
                previousClose: 18200,
                change: 300,
                changePercent: 1.65,
                high: 18700,
                low: 18100,
                volume: 8500000,
                marketCap: 0,
                foreignOwnership: 0,
            },
        };

        return mockData[stockCode] || this.generateMockStockInfo(stockCode);
    }

    /**
     * 차트 데이터 크롤링 (모의 구현)
     */
    async getChartData(stockCode: string, days: number = 30): Promise<TossChartData[]> {
        console.log(`[TossCrawler] Fetching chart data for ${stockCode} (${days} days)`);

        const data: TossChartData[] = [];
        const basePrice = 70000;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const volatility = Math.random() * 2000 - 1000;
            const open = basePrice + volatility + (days - i) * 50;
            const close = open + (Math.random() * 1000 - 500);

            data.push({
                date: date.toISOString().split("T")[0],
                open: Math.round(open),
                high: Math.round(Math.max(open, close) + Math.random() * 500),
                low: Math.round(Math.min(open, close) - Math.random() * 500),
                close: Math.round(close),
                volume: Math.floor(Math.random() * 10000000) + 1000000,
            });
        }

        return data;
    }

    /**
     * 호가창 크롤링 (모의 구현)
     */
    async getOrderBook(stockCode: string): Promise<TossOrderBook> {
        console.log(`[TossCrawler] Fetching order book for ${stockCode}`);

        const currentPrice = 78000;
        const asks: Array<{ price: number; quantity: number }> = [];
        const bids: Array<{ price: number; quantity: number }> = [];

        for (let i = 1; i <= 10; i++) {
            asks.push({
                price: currentPrice + i * 100,
                quantity: Math.floor(Math.random() * 50000) + 10000,
            });
            bids.push({
                price: currentPrice - i * 100,
                quantity: Math.floor(Math.random() * 50000) + 10000,
            });
        }

        return { asks, bids };
    }

    private generateMockStockInfo(stockCode: string): TossStockInfo {
        const basePrice = 50000 + Math.random() * 50000;
        const change = (Math.random() * 2000) - 1000;

        return {
            stockCode,
            stockName: `종목 ${stockCode}`,
            currentPrice: Math.round(basePrice),
            previousClose: Math.round(basePrice - change),
            change: Math.round(change),
            changePercent: Number((change / basePrice * 100).toFixed(2)),
            high: Math.round(basePrice + Math.random() * 1000),
            low: Math.round(basePrice - Math.random() * 1000),
            volume: Math.floor(Math.random() * 10000000),
            marketCap: Math.floor(Math.random() * 100000000000000),
            foreignOwnership: Math.round(Math.random() * 60 * 10) / 10,
        };
    }
}

export const tossCrawler = new TossCrawler();
