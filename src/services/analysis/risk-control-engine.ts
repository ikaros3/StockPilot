import type { RiskFactor, DefenseStrategy, RiskControlAnalysis, StopLossInfo } from "@/types";

/**
 * 리스크 관리 엔진
 * 손절선, 리스크 요인, 방어 전략을 계산합니다.
 */
export class RiskControlEngine {
    /**
     * 손절선 계산
     */
    calculateStopLoss(
        purchasePrice: number,
        quantity: number,
        totalPortfolioValue: number,
        priceStopLossPercent: number = 10,
        portfolioStopLossPercent: number = 15
    ): StopLossInfo {
        const priceBasedStopLoss = Math.round(purchasePrice * (1 - priceStopLossPercent / 100));

        // 포트폴리오 손실 한도 기준 손절가 계산
        const maxLoss = totalPortfolioValue * (portfolioStopLossPercent / 100);
        const portfolioBasedStopLoss = Math.round(purchasePrice - (maxLoss / quantity));

        return {
            priceBasedStopLoss,
            portfolioBasedStopLoss,
        };
    }

    /**
     * 리스크 요인 식별
     */
    identifyRiskFactors(stockCode: string): RiskFactor[] {
        // 실제로는 API나 데이터베이스에서 종목별 리스크 정보를 가져옴
        // 여기서는 기본 리스크 요인 반환
        return [
            {
                category: "시장 리스크",
                description: "글로벌 경기 침체 가능성",
                severity: "medium",
            },
            {
                category: "산업 리스크",
                description: "업종 전반 수요 둔화 우려",
                severity: "high",
            },
            {
                category: "기업 리스크",
                description: "경쟁 심화로 인한 수익성 하락",
                severity: "low",
            },
            {
                category: "환율 리스크",
                description: "원/달러 환율 변동",
                severity: "medium",
            },
        ];
    }

    /**
     * 방어 전략 제시
     */
    suggestDefenseStrategies(riskLevel: "high" | "medium" | "low"): DefenseStrategy[] {
        const strategies: DefenseStrategy[] = [];

        if (riskLevel === "high" || riskLevel === "medium") {
            strategies.push({
                type: "partial_sell",
                description: "부분 매도",
                recommendation: "손실 -5% 도달 시 30% 물량 정리",
            });
        }

        strategies.push({
            type: "reduce_position",
            description: "비중 축소",
            recommendation: "포트폴리오 비중 20% 이하로 조정",
        });

        if (riskLevel === "high") {
            strategies.push({
                type: "hedge",
                description: "헤지 전략",
                recommendation: "인버스 ETF 10% 편입 고려",
            });
        }

        return strategies;
    }

    /**
     * 전체 리스크 분석 생성
     */
    generateRiskControlAnalysis(
        purchasePrice: number,
        quantity: number,
        totalPortfolioValue: number,
        stockCode: string
    ): RiskControlAnalysis {
        const riskFactors = this.identifyRiskFactors(stockCode);
        const highRiskCount = riskFactors.filter(r => r.severity === "high").length;
        const overallRiskLevel = highRiskCount >= 2 ? "high" : highRiskCount === 1 ? "medium" : "low";

        return {
            stopLoss: this.calculateStopLoss(purchasePrice, quantity, totalPortfolioValue),
            riskFactors,
            defenseStrategies: this.suggestDefenseStrategies(overallRiskLevel),
        };
    }
}

export const riskControlEngine = new RiskControlEngine();
