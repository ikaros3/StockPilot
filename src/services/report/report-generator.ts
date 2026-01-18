import { Timestamp } from "firebase/firestore";
import type { AnalysisReport, Holding } from "@/types";
import { summaryEngine } from "../analysis/summary-engine";
import { exitTimingEngine } from "../analysis/exit-timing-engine";
import { riskControlEngine } from "../analysis/risk-control-engine";
import { priceService } from "../market-data/price-service";
import { financialService } from "../market-data/financial-service";
import { analystService } from "../market-data/analyst-service";

/**
 * 리포트 생성 서비스
 * 보유 종목에 대한 종합 분석 리포트를 생성합니다.
 */
export class ReportGenerator {
    /**
     * 종합 분석 리포트 생성
     */
    async generateFullReport(
        holding: Holding,
        totalPortfolioValue: number
    ): Promise<AnalysisReport> {
        const { stockCode, stockName, purchasePrice, quantity } = holding;

        // 현재 가격 조회
        const priceData = await priceService.getCurrentPrice(stockCode);
        const currentPrice = priceData.currentPrice;

        // 밸류에이션 지표 조회
        const valuationMetrics = await financialService.getValuationMetrics(stockCode);

        // 애널리스트 데이터 조회
        const consensus = await analystService.getConsensus(stockCode);
        const reports = await analystService.getReports(stockCode);
        const potential = analystService.calculatePotential(currentPrice, consensus);

        // 목표가 설정 (컨센서스 평균 기준)
        const targetPrice = consensus.averageTargetPrice;

        // 요약 분석 생성
        const summary = summaryEngine.generateSummaryAnalysis(
            stockName,
            purchasePrice,
            currentPrice,
            targetPrice,
            quantity,
            totalPortfolioValue,
            {
                businessStructure: "업종 내 주요 사업자",
                industryPosition: "시장 선도 기업",
                dividendPolicy: "배당 성향 안정적",
            },
            valuationMetrics
        );

        // 매도 타이밍 분석 생성
        const exitTiming = exitTimingEngine.generateExitTimingAnalysis(
            purchasePrice,
            currentPrice,
            quantity
        );

        // 리스크 분석 생성
        const riskControl = riskControlEngine.generateRiskControlAnalysis(
            purchasePrice,
            quantity,
            totalPortfolioValue,
            stockCode
        );

        return {
            id: `report_${holding.id}_${Date.now()}`,
            holdingId: holding.id,
            stockCode,
            stockName,
            summary,
            exitTiming,
            accumulation: {
                accumulationZone: {
                    minPrice: Math.round(currentPrice * 0.9),
                    maxPrice: Math.round(currentPrice * 0.95),
                    supportLevel: Math.round(currentPrice * 0.85),
                    valuationBasis: "PER 기준 저평가 수준",
                },
                recommendedRatio: 20,
                buyConditions: [
                    { condition: "지지선 근접", trigger: `${Math.round(currentPrice * 0.9).toLocaleString()}원 이하` },
                    { condition: "RSI 과매도", trigger: "RSI 30 이하" },
                ],
            },
            riskControl,
            tradingStrategy: {
                marketPhase: "trend_following",
                marketPhaseDescription: "현재 상승 추세를 유지하고 있습니다.",
                recommendedStrategy: "medium_hold",
                strategyRationale: "중기 보유 전략이 적합합니다.",
                portfolioRole: "core_growth",
                roleDescription: "포트폴리오의 핵심 성장 동력입니다.",
            },
            holdingPeriod: {
                recommendedHorizon: "medium",
                estimatedPeriod: "3-6개월",
                rationale: {
                    industryCycle: "업황 회복 초기 단계",
                    earningsCycle: "실적 턴어라운드 예상",
                    macroEnvironment: "금리 인하 기대감",
                },
            },
            analystInsight: {
                reports: reports.map(r => ({
                    firm: r.firm,
                    date: r.date,
                    opinion: r.opinion,
                    targetPrice: r.targetPrice,
                    keyPoints: r.keyPoints,
                })),
                consensus: {
                    ...consensus,
                    currentPrice,
                    ...potential,
                },
                outlookTimeline: [
                    { period: "2026 Q1", outlook: "실적 개선 예상", keyFactors: ["수요 회복", "가격 인상"] },
                    { period: "2026 Q2", outlook: "본격 성장기 진입", keyFactors: ["신제품 출시", "시장점유율 확대"] },
                ],
            },
            finalVerdict: {
                investmentGrade: 4,
                overallAssessment: `${stockName}은(는) 현재 밸류에이션 및 업황을 고려할 때 보유 또는 추가 매수가 적합한 종목입니다.`,
                recommendedActions: [
                    "현재 비중 유지",
                    "1차 목표가 도달 시 50% 익절",
                    "주간 단위 모니터링",
                ],
                monitoringChecklist: [
                    "분기 실적 발표 확인",
                    "업황 지표 모니터링",
                    "경쟁사 동향 파악",
                ],
            },
            generatedAt: Timestamp.now(),
        };
    }

    /**
     * 리포트 요약 생성 (대시보드용)
     */
    async generateReportSummary(holding: Holding): Promise<{
        investmentGrade: number;
        keyAction: string;
        status: "bullish" | "neutral" | "bearish";
    }> {
        const priceData = await priceService.getCurrentPrice(holding.stockCode);
        const profitRate = ((priceData.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;

        let status: "bullish" | "neutral" | "bearish";
        let investmentGrade: number;
        let keyAction: string;

        if (profitRate >= 15) {
            status = "bullish";
            investmentGrade = 4;
            keyAction = "1차 목표가 도달 임박, 부분 익절 준비";
        } else if (profitRate >= 5) {
            status = "bullish";
            investmentGrade = 4;
            keyAction = "현재 비중 유지, 상승 추세 지속";
        } else if (profitRate >= -5) {
            status = "neutral";
            investmentGrade = 3;
            keyAction = "관망, 추가 매수 기회 대기";
        } else if (profitRate >= -10) {
            status = "bearish";
            investmentGrade = 2;
            keyAction = "손절선 근접, 방어 전략 검토";
        } else {
            status = "bearish";
            investmentGrade = 1;
            keyAction = "손절선 이탈, 즉시 대응 필요";
        }

        return { investmentGrade, keyAction, status };
    }
}

export const reportGenerator = new ReportGenerator();
