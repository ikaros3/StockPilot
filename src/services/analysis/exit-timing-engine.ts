import type { ExitStrategy, ExitTimingAnalysis } from "@/types";

/**
 * 매도 타이밍 분석 엔진
 * 1차/2차 익절 전략, 손절 전략을 계산합니다.
 */
export class ExitTimingEngine {
    /**
     * 1차 익절 전략 생성
     */
    generateFirstExitStrategy(
        purchasePrice: number,
        currentPrice: number,
        quantity: number,
        targetReturn: number = 15 // 기본 1차 목표 수익률 15%
    ): ExitStrategy {
        const targetPrice = Math.round(purchasePrice * (1 + targetReturn / 100));
        const sellQuantityRatio = 50; // 50% 물량 정리
        const sellQuantity = Math.floor(quantity * (sellQuantityRatio / 100));
        const expectedProfit = (targetPrice - purchasePrice) * sellQuantity;

        return {
            targetPrice,
            sellQuantityRatio,
            expectedProfit,
            rationale: `기술적으로 ${targetPrice.toLocaleString()}원 구간은 단기 저항선입니다. 1차 목표가 도달 시 ${sellQuantityRatio}% 물량 정리로 수익 확정을 권장합니다.`,
            recommendedTiming: "목표가 도달 시 즉시 또는 향후 1-2개월 내",
            riskFactors: ["시장 변동성 확대", "업종 전반 하락 가능성"],
            holdingPeriod: "단기 (1-3개월)",
        };
    }

    /**
     * 2차 익절 전략 생성
     */
    generateSecondExitStrategy(
        purchasePrice: number,
        currentPrice: number,
        quantity: number,
        firstExitRatio: number = 50,
        targetReturn: number = 30 // 기본 2차 목표 수익률 30%
    ): ExitStrategy {
        const targetPrice = Math.round(purchasePrice * (1 + targetReturn / 100));
        const remainingQuantity = Math.floor(quantity * (1 - firstExitRatio / 100));
        const expectedProfit = (targetPrice - purchasePrice) * remainingQuantity;

        return {
            targetPrice,
            sellQuantityRatio: 100 - firstExitRatio,
            expectedProfit,
            rationale: `장기 관점에서 ${targetPrice.toLocaleString()}원까지 추가 상승 여력이 있습니다. 잔여 물량은 장기 보유 후 전량 매도를 고려하세요.`,
            recommendedTiming: "향후 6개월-1년",
            riskFactors: ["거시 경제 불확실성", "기업 실적 변동"],
            holdingPeriod: "중장기 (6-12개월)",
        };
    }

    /**
     * 매도 추천 문구 생성
     */
    generateExitRecommendation(
        firstStrategy: ExitStrategy,
        secondStrategy: ExitStrategy
    ): string {
        return `단계적 익절 전략을 권장합니다. 1차 목표가(₩${firstStrategy.targetPrice.toLocaleString()})에서 ${firstStrategy.sellQuantityRatio}%를 매도하여 수익을 확정하고, 잔여 물량은 2차 목표가(₩${secondStrategy.targetPrice.toLocaleString()})까지 보유하세요.`;
    }

    /**
     * 전체 매도 타이밍 분석 생성
     */
    generateExitTimingAnalysis(
        purchasePrice: number,
        currentPrice: number,
        quantity: number
    ): ExitTimingAnalysis {
        const firstExit = this.generateFirstExitStrategy(purchasePrice, currentPrice, quantity);
        const secondExit = this.generateSecondExitStrategy(purchasePrice, currentPrice, quantity);

        return {
            firstExitStrategy: firstExit,
            secondExitStrategy: secondExit,
            recommendation: this.generateExitRecommendation(firstExit, secondExit),
        };
    }
}

export const exitTimingEngine = new ExitTimingEngine();
