import { Timestamp } from "firebase/firestore";

// ============================================
// Agent/Skill 공통 인터페이스
// ============================================

/**
 * Agent 기본 인터페이스
 * 여러 Skill을 조합하여 분석을 수행하는 오케스트레이터
 */
export interface BaseAgent<TInput, TOutput> {
    analyze(input: TInput): Promise<TOutput>;
}

/**
 * Skill 기본 인터페이스
 * 단일 책임 원칙을 따르는 분석 기능 단위
 */
export interface BaseSkill<TInput, TOutput> {
    execute(input: TInput): Promise<TOutput>;
}

/**
 * 분석 컨텍스트 (공통 입력)
 * 모든 분석 모듈에서 공유하는 기본 정보
 */
export interface AnalysisContext {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    purchasePrice: number;
    quantity: number;
    portfolioId?: string;
    userId?: string;
}

// ============================================
// 분석 리포트 메인 타입
// ============================================

/**
 * 종목 분석 리포트
 */
export interface AnalysisReport {
    id: string;
    holdingId: string;
    stockCode: string;
    stockName: string;

    summary: SummaryAnalysis;
    exitTiming: ExitTimingAnalysis;
    accumulation: AccumulationAnalysis;
    riskControl: RiskControlAnalysis;
    tradingStrategy: TradingStrategyAnalysis;
    holdingPeriod: HoldingPeriodAnalysis;
    analystInsight: AnalystInsightAnalysis;
    finalVerdict: FinalVerdictAnalysis;

    generatedAt: Timestamp;
}

// ============================================
// 요약 탭
// ============================================

export interface SummaryAnalysis {
    performanceText: string;      // 현재 성과 평가 문장
    targetProgress: number;       // 목표가 대비 진행률 (%)
    stockCharacteristics: StockCharacteristics;
    valuationStatus: string;
    valuationMetrics: ValuationMetrics;
    portfolioWeight: number;      // 포트폴리오 내 비중 (%)
}

export interface StockCharacteristics {
    businessStructure: string;    // 사업 구조
    industryPosition: string;     // 산업 포지션
    dividendPolicy: string;       // 배당 성향
}

export interface ValuationMetrics {
    per: number;
    pbr: number;
    roe: number;
    eps: number;
}

// ============================================
// 매도 타이밍 탭
// ============================================

export interface ExitTimingAnalysis {
    firstExitStrategy: ExitStrategy;
    secondExitStrategy: ExitStrategy;
    recommendation: string;       // 단계적 익절 추천 문구
}

export interface ExitStrategy {
    targetPrice: number;          // 목표가
    sellQuantityRatio: number;    // 매도 수량 비율 (%)
    expectedProfit: number;       // 예상 수익
    rationale: string;            // 기술적/펀더멘털 근거
    recommendedTiming: string;    // 권장 시점
    riskFactors: string[];        // 리스크 요인
    holdingPeriod: string;        // 예상 보유 기간
}

// ============================================
// 추가 매수 탭
// ============================================

export interface AccumulationAnalysis {
    accumulationZone: AccumulationZone;
    recommendedRatio: number;     // 권장 추가 매수 비중 (%)
    buyConditions: BuyCondition[];
}

export interface AccumulationZone {
    minPrice: number;             // 매수 구간 최저가
    maxPrice: number;             // 매수 구간 최고가
    supportLevel: number;         // 지지선
    valuationBasis: string;       // 밸류에이션 저평가 근거
}

export interface BuyCondition {
    condition: string;
    trigger: string;
}

// ============================================
// 익절/손절 탭
// ============================================

export interface RiskControlAnalysis {
    stopLoss: StopLossInfo;
    riskFactors: RiskFactor[];
    defenseStrategies: DefenseStrategy[];
}

export interface StopLossInfo {
    priceBasedStopLoss: number;       // 가격 기준 손절선
    portfolioBasedStopLoss: number;   // 포트폴리오 손실 한도 기준
}

export interface RiskFactor {
    category: string;
    description: string;
    severity: "high" | "medium" | "low";
}

export interface DefenseStrategy {
    type: "partial_sell" | "reduce_position" | "hedge";
    description: string;
    recommendation: string;
}

// ============================================
// 매매 전략 탭
// ============================================

export type MarketPhase = "trend_following" | "range_bound" | "high_volatility";
export type StrategyType = "short_swing" | "medium_hold" | "long_term";
export type PortfolioRole = "core_growth" | "defensive" | "leverage";

export interface TradingStrategyAnalysis {
    marketPhase: MarketPhase;
    marketPhaseDescription: string;
    recommendedStrategy: StrategyType;
    strategyRationale: string;
    portfolioRole: PortfolioRole;
    roleDescription: string;
}

// ============================================
// 보유 기간 탭
// ============================================

export type HoldingHorizon = "short" | "medium" | "long";

export interface HoldingPeriodAnalysis {
    recommendedHorizon: HoldingHorizon;
    estimatedPeriod: string;      // 예: "3-6개월"
    rationale: HoldingRationale;
}

export interface HoldingRationale {
    industryCycle: string;        // 산업 사이클 단계
    earningsCycle: string;        // 실적 사이클 위치
    macroEnvironment: string;     // 거시 환경 (금리, 경기, 정책)
}

// ============================================
// 애널리스트 탭
// ============================================

export type InvestmentOpinion = "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";

export interface AnalystInsightAnalysis {
    reports: AnalystReportSummary[];
    consensus: ConsensusData;
    outlookTimeline: OutlookItem[];
}

export interface AnalystReportSummary {
    firm: string;                 // 증권사명
    date: string;
    opinion: InvestmentOpinion;
    targetPrice: number;
    keyPoints: string[];
}

export interface ConsensusData {
    averageTargetPrice: number;
    highTargetPrice: number;
    lowTargetPrice: number;
    currentPrice: number;
    upsidePotential: number;      // 상방 여력 (%)
    downsideRisk: number;         // 하방 리스크 (%)
    opinionDistribution: Record<InvestmentOpinion, number>;
}

export interface OutlookItem {
    period: string;               // 예: "2026 Q1"
    outlook: string;
    keyFactors: string[];
}

// ============================================
// 종합 평가 탭
// ============================================

export interface FinalVerdictAnalysis {
    investmentGrade: number;      // 투자 등급 (1-5)
    overallAssessment: string;    // 종합 평가 문장
    recommendedActions: string[];
    monitoringChecklist: string[];
}
