import type { Portfolio, Holding } from "@/types";
import { priceService } from "../market-data/price-service";

/**
 * 비중 분석 결과
 */
export interface WeightAnalysis {
    holdings: Array<{
        holdingId: string;
        stockCode: string;
        stockName: string;
        currentWeight: number;
        targetWeight: number;
        deviation: number;
        action: "increase" | "decrease" | "maintain";
    }>;
    maxConcentration: number;
    concentrationWarning: boolean;
}

/**
 * 섹터 분석 결과
 */
export interface SectorAnalysis {
    sectors: Array<{
        sector: string;
        weight: number;
        holdingCount: number;
        recommendation: string;
    }>;
    diversificationScore: number;
    topSector: string;
    topSectorWeight: number;
}

/**
 * 고위험 자산
 */
export interface RiskAsset {
    holdingId: string;
    stockCode: string;
    stockName: string;
    riskLevel: "high" | "medium" | "low";
    riskFactors: string[];
    suggestedAction: string;
}

/**
 * 리밸런싱 시나리오
 */
export interface RebalancingScenario {
    id: string;
    name: string;
    description: string;
    trades: Array<{
        stockCode: string;
        stockName: string;
        action: "buy" | "sell";
        quantity: number;
        estimatedAmount: number;
    }>;
    expectedImprovement: {
        diversification: number;
        riskReduction: number;
    };
}

/**
 * 리밸런싱 엔진
 */
export class RebalancingEngine {
    /**
     * 비중 불균형 분석
     */
    async analyzeWeightImbalance(
        holdings: Holding[],
        totalPortfolioValue: number
    ): Promise<WeightAnalysis> {
        const holdingsAnalysis = await Promise.all(
            holdings.map(async (holding) => {
                const priceData = await priceService.getCurrentPrice(holding.stockCode);
                const holdingValue = priceData.currentPrice * holding.quantity;
                const currentWeight = (holdingValue / totalPortfolioValue) * 100;

                // 권장 비중: 균등 배분 기준
                const targetWeight = 100 / holdings.length;
                const deviation = currentWeight - targetWeight;

                let action: "increase" | "decrease" | "maintain" = "maintain";
                if (deviation > 5) action = "decrease";
                else if (deviation < -5) action = "increase";

                return {
                    holdingId: holding.id,
                    stockCode: holding.stockCode,
                    stockName: holding.stockName,
                    currentWeight: Number(currentWeight.toFixed(2)),
                    targetWeight: Number(targetWeight.toFixed(2)),
                    deviation: Number(deviation.toFixed(2)),
                    action,
                };
            })
        );

        const maxConcentration = Math.max(...holdingsAnalysis.map(h => h.currentWeight));

        return {
            holdings: holdingsAnalysis,
            maxConcentration,
            concentrationWarning: maxConcentration > 30, // 30% 초과 시 경고
        };
    }

    /**
     * 섹터 집중도 분석
     */
    analyzeSectorConcentration(holdings: Holding[]): SectorAnalysis {
        // 실제로는 종목별 섹터 정보가 필요
        // 여기서는 모의 섹터 배정
        const sectorMap: Record<string, string> = {
            "005930": "반도체",
            "035720": "인터넷",
            "066570": "전자제품",
            "122630": "ETF",
        };

        const sectorWeights: Record<string, { weight: number; count: number }> = {};

        holdings.forEach(holding => {
            const sector = sectorMap[holding.stockCode] || "기타";
            if (!sectorWeights[sector]) {
                sectorWeights[sector] = { weight: 0, count: 0 };
            }
            sectorWeights[sector].weight += 100 / holdings.length; // 균등 가정
            sectorWeights[sector].count++;
        });

        const sectors = Object.entries(sectorWeights).map(([sector, data]) => ({
            sector,
            weight: Number(data.weight.toFixed(2)),
            holdingCount: data.count,
            recommendation: data.weight > 40 ? "비중 축소 권장" : "적정 수준",
        }));

        const sortedSectors = sectors.sort((a, b) => b.weight - a.weight);
        const topSector = sortedSectors[0];

        // 분산 점수 계산 (HHI 기반)
        const hhi = sectors.reduce((sum, s) => sum + Math.pow(s.weight / 100, 2), 0);
        const diversificationScore = Math.round((1 - hhi) * 100);

        return {
            sectors,
            diversificationScore,
            topSector: topSector?.sector || "",
            topSectorWeight: topSector?.weight || 0,
        };
    }

    /**
     * 고위험 자산 탐지
     */
    async detectHighRiskAssets(holdings: Holding[]): Promise<RiskAsset[]> {
        const riskAssets: RiskAsset[] = [];

        for (const holding of holdings) {
            const priceData = await priceService.getCurrentPrice(holding.stockCode);
            const profitRate = ((priceData.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;

            const riskFactors: string[] = [];
            let riskLevel: "high" | "medium" | "low" = "low";

            // 손실률 기반 리스크 평가
            if (profitRate < -15) {
                riskFactors.push("15% 이상 손실 중");
                riskLevel = "high";
            } else if (profitRate < -10) {
                riskFactors.push("10% 이상 손실 중");
                riskLevel = "medium";
            }

            // 레버리지/인버스 ETF 체크
            if (holding.stockName.includes("레버리지") || holding.stockName.includes("인버스")) {
                riskFactors.push("고위험 레버리지/인버스 상품");
                riskLevel = "high";
            }

            if (riskLevel !== "low") {
                riskAssets.push({
                    holdingId: holding.id,
                    stockCode: holding.stockCode,
                    stockName: holding.stockName,
                    riskLevel,
                    riskFactors,
                    suggestedAction: riskLevel === "high"
                        ? "비중 축소 또는 손절 검토"
                        : "모니터링 강화",
                });
            }
        }

        return riskAssets;
    }

    /**
     * 리밸런싱 시나리오 생성
     */
    async generateRebalancingScenarios(
        holdings: Holding[],
        totalPortfolioValue: number
    ): Promise<RebalancingScenario[]> {
        const weightAnalysis = await this.analyzeWeightImbalance(holdings, totalPortfolioValue);
        const scenarios: RebalancingScenario[] = [];

        // 시나리오 1: 균등 배분
        const equalWeightTrades = weightAnalysis.holdings
            .filter(h => h.action !== "maintain")
            .map(h => ({
                stockCode: h.stockCode,
                stockName: h.stockName,
                action: h.action === "decrease" ? "sell" as const : "buy" as const,
                quantity: Math.abs(Math.floor((h.deviation / 100) * totalPortfolioValue / 78000)), // 예시 가격
                estimatedAmount: Math.abs(Math.floor((h.deviation / 100) * totalPortfolioValue)),
            }));

        if (equalWeightTrades.length > 0) {
            scenarios.push({
                id: "scenario_equal",
                name: "균등 배분",
                description: "모든 종목을 동일한 비중으로 조정합니다.",
                trades: equalWeightTrades,
                expectedImprovement: {
                    diversification: 15,
                    riskReduction: 10,
                },
            });
        }

        // 시나리오 2: 집중 비중 완화
        const concentrated = weightAnalysis.holdings.filter(h => h.currentWeight > 30);
        if (concentrated.length > 0) {
            scenarios.push({
                id: "scenario_reduce_concentration",
                name: "집중 비중 완화",
                description: "30%를 초과하는 종목의 비중을 축소합니다.",
                trades: concentrated.map(h => ({
                    stockCode: h.stockCode,
                    stockName: h.stockName,
                    action: "sell" as const,
                    quantity: Math.floor((h.currentWeight - 25) / 100 * totalPortfolioValue / 78000),
                    estimatedAmount: Math.floor((h.currentWeight - 25) / 100 * totalPortfolioValue),
                })),
                expectedImprovement: {
                    diversification: 20,
                    riskReduction: 15,
                },
            });
        }

        return scenarios;
    }
}

export const rebalancingEngine = new RebalancingEngine();
