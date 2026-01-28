/**
 * Analysis Services Index
 * 분석 서비스 모듈 통합 export
 * 
 * 기존 엔진 (레거시 - 마이그레이션 예정)
 * - summaryEngine
 * - exitTimingEngine
 * - riskControlEngine
 * 
 * 새로운 모듈 구조 (Agent/Skill 패턴)
 * - summary/
 * - analyst/
 * - trading-strategy/
 * - exit-timing/
 * - accumulation/
 * - holding-period/
 * - risk-control/
 */

// ============================================
// 기존 엔진 (레거시) - 호환성 유지
// ============================================
export { summaryEngine, SummaryEngine } from "./summary-engine";
export { exitTimingEngine, ExitTimingEngine } from "./exit-timing-engine";
export { riskControlEngine, RiskControlEngine } from "./risk-control-engine";

// ============================================
// 새로운 모듈 구조 (Agent/Skill 패턴)
// 참고: market-data의 AnalystService와 이름 충돌 방지를 위해
//       새 모듈은 명시적 이름으로 export
// ============================================

// Summary Module
export {
    SummaryAgent,
    summaryAgent,
    PerformanceEvaluator,
    performanceEvaluator,
    CharacteristicsAnalyzer,
    characteristicsAnalyzer,
    SummaryService as SummaryAnalysisService,
    summaryService as summaryAnalysisService,
} from "./summary";

// Analyst Module (분석용 - 기존 market-data의 AnalystService와 구분)
export {
    AnalystAgent,
    analystAgent,
    ReportCrawler,
    reportCrawler,
    ConsensusCalculator,
    consensusCalculator,
    ReportSummarizer,
    reportSummarizer,
    AnalystService as AnalystAnalysisService,
    analystService as analystAnalysisService,
} from "./analyst";

// Trading Strategy Module
export {
    StrategyAgent,
    strategyAgent,
    MarketAnalyzer,
    marketAnalyzer,
    BacktestRunner,
    backtestRunner,
    StrategyGenerator,
    strategyGenerator,
    TradingStrategyService,
    tradingStrategyService,
} from "./trading-strategy";

// Exit Timing Module (New)
export {
    ExitTimingAgent,
    exitTimingAgent,
    SignalDetector,
    signalDetector,
    ExitPlanGenerator,
    exitPlanGenerator,
    ExitTimingService,
    exitTimingService,
} from "./exit-timing";

// Accumulation Module
export {
    AccumulationAgent,
    accumulationAgent,
    BuySignalDetector,
    buySignalDetector,
    PositionCalculator,
    positionCalculator,
    AccumulationService,
    accumulationService,
} from "./accumulation";

// Holding Period Module
export {
    HoldingPeriodAgent,
    holdingPeriodAgent,
    EventScheduler,
    eventScheduler,
    PeriodRecommender,
    periodRecommender,
    HoldingPeriodService,
    holdingPeriodService,
} from "./holding-period";

// Risk Control Module (New)
export {
    RiskControlAgent,
    riskControlAgent,
    StopLossCalculator,
    stopLossCalculator,
    TrailingStopManager,
    trailingStopManager,
    RiskControlService,
    riskControlService,
} from "./risk-control";
