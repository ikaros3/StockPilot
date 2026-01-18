/**
 * 재무제표 데이터 타입
 */
export interface Financials {
    stockCode: string;
    fiscalYear: string;
    revenue: number;
    operatingProfit: number;
    netIncome: number;
    totalAssets: number;
    totalEquity: number;
    totalDebt: number;
}

/**
 * 밸류에이션 메트릭스
 */
export interface ValuationMetrics {
    per: number;
    pbr: number;
    psr: number;
    evEbitda: number;
    roe: number;
    roa: number;
    eps: number;
    bps: number;
    dps: number;
    dividendYield: number;
}

/**
 * 재무 데이터 서비스
 * 재무제표 및 밸류에이션 데이터를 제공합니다.
 */
export class FinancialService {
    /**
     * 재무제표 조회 (모의 데이터)
     */
    async getFinancials(stockCode: string): Promise<Financials> {
        // 모의 데이터 - 실제로는 DART API 등에서 조회
        const mockFinancials: Record<string, Financials> = {
            "005930": {
                stockCode: "005930",
                fiscalYear: "2025",
                revenue: 302000000000000, // 302조
                operatingProfit: 43000000000000, // 43조
                netIncome: 35000000000000, // 35조
                totalAssets: 450000000000000,
                totalEquity: 320000000000000,
                totalDebt: 130000000000000,
            },
        };

        return mockFinancials[stockCode] || this.generateMockFinancials(stockCode);
    }

    /**
     * 밸류에이션 지표 조회 (모의 데이터)
     */
    async getValuationMetrics(stockCode: string): Promise<ValuationMetrics> {
        const mockMetrics: Record<string, ValuationMetrics> = {
            "005930": {
                per: 12.5,
                pbr: 1.2,
                psr: 1.8,
                evEbitda: 5.2,
                roe: 15.3,
                roa: 8.5,
                eps: 6240,
                bps: 65000,
                dps: 2994,
                dividendYield: 3.84,
            },
        };

        return mockMetrics[stockCode] || this.generateMockMetrics(stockCode);
    }

    /**
     * 성장률 계산
     */
    calculateGrowthRate(current: number, previous: number): number {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    private generateMockFinancials(stockCode: string): Financials {
        const revenue = Math.floor(Math.random() * 100000000000000) + 10000000000000;
        const operatingProfit = Math.floor(revenue * (Math.random() * 0.15 + 0.05));

        return {
            stockCode,
            fiscalYear: "2025",
            revenue,
            operatingProfit,
            netIncome: Math.floor(operatingProfit * 0.8),
            totalAssets: Math.floor(revenue * 1.5),
            totalEquity: Math.floor(revenue * 1.0),
            totalDebt: Math.floor(revenue * 0.5),
        };
    }

    private generateMockMetrics(stockCode: string): ValuationMetrics {
        return {
            per: Math.round((Math.random() * 20 + 5) * 10) / 10,
            pbr: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
            psr: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
            evEbitda: Math.round((Math.random() * 10 + 3) * 10) / 10,
            roe: Math.round((Math.random() * 20 + 5) * 10) / 10,
            roa: Math.round((Math.random() * 10 + 2) * 10) / 10,
            eps: Math.floor(Math.random() * 10000 + 1000),
            bps: Math.floor(Math.random() * 100000 + 20000),
            dps: Math.floor(Math.random() * 5000 + 500),
            dividendYield: Math.round((Math.random() * 5 + 1) * 100) / 100,
        };
    }
}

export const financialService = new FinancialService();
