import type {
    SummaryAnalysis,
    StockCharacteristics,
    ValuationMetrics
} from "@/types";

/**
 * 요약 분석 엔진
 * 현재 성과 평가, 목표가 진행률, 종목 특성, 밸류에이션을 계산합니다.
 */
export class SummaryEngine {
    /**
     * 성과 평가 문장 생성
     */
    generatePerformanceText(
        stockName: string,
        purchasePrice: number,
        currentPrice: number,
        targetPrice: number
    ): string {
        const profitRate = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        const targetProgress = ((currentPrice - purchasePrice) / (targetPrice - purchasePrice)) * 100;

        let statusText: string;
        if (profitRate >= 20) {
            statusText = "매우 우수한 성과를 보이고 있습니다";
        } else if (profitRate >= 10) {
            statusText = "양호한 성과를 보이고 있습니다";
        } else if (profitRate >= 0) {
            statusText = "소폭 상승한 상태입니다";
        } else if (profitRate >= -10) {
            statusText = "소폭 하락한 상태입니다";
        } else {
            statusText = "주의가 필요한 상태입니다";
        }

        return `${stockName}은(는) 현재 매수가 대비 ${profitRate.toFixed(1)}% ${profitRate >= 0 ? '상승' : '하락'}하여 ${statusText}. 목표 수익률의 ${targetProgress.toFixed(0)}%를 달성했습니다.`;
    }

    /**
     * 목표가 대비 진행률 계산
     */
    calculateTargetProgress(
        purchasePrice: number,
        currentPrice: number,
        targetPrice: number
    ): number {
        if (targetPrice === purchasePrice) return 0;
        const progress = ((currentPrice - purchasePrice) / (targetPrice - purchasePrice)) * 100;
        return Math.max(0, Math.min(100, progress));
    }

    /**
     * 밸류에이션 상태 평가
     */
    evaluateValuation(metrics: ValuationMetrics): string {
        const { per, pbr, roe } = metrics;

        // 간단한 밸류에이션 로직
        if (per < 10 && pbr < 1 && roe > 15) {
            return "현재 저평가 상태로 판단됩니다. 추가 매수 기회가 될 수 있습니다.";
        } else if (per < 15 && pbr < 1.5) {
            return "적정 밸류에이션 수준입니다.";
        } else if (per > 20 || pbr > 2) {
            return "밸류에이션이 다소 높은 편입니다. 신중한 접근이 필요합니다.";
        }

        return "밸류에이션은 업종 평균 수준입니다.";
    }

    /**
     * 포트폴리오 내 비중 계산
     */
    calculatePortfolioWeight(
        holdingValue: number,
        totalPortfolioValue: number
    ): number {
        if (totalPortfolioValue === 0) return 0;
        return (holdingValue / totalPortfolioValue) * 100;
    }

    /**
     * 전체 요약 분석 생성
     */
    generateSummaryAnalysis(
        stockName: string,
        purchasePrice: number,
        currentPrice: number,
        targetPrice: number,
        quantity: number,
        totalPortfolioValue: number,
        characteristics: StockCharacteristics,
        metrics: ValuationMetrics
    ): SummaryAnalysis {
        const holdingValue = currentPrice * quantity;

        return {
            performanceText: this.generatePerformanceText(stockName, purchasePrice, currentPrice, targetPrice),
            targetProgress: this.calculateTargetProgress(purchasePrice, currentPrice, targetPrice),
            stockCharacteristics: characteristics,
            valuationStatus: this.evaluateValuation(metrics),
            valuationMetrics: metrics,
            portfolioWeight: this.calculatePortfolioWeight(holdingValue, totalPortfolioValue),
        };
    }
}

export const summaryEngine = new SummaryEngine();
