// =============================================================================
// 시장 데이터 서비스 (Market Data Services)
// =============================================================================

// 기존 서비스
export { priceService, PriceService } from "./price-service";
export type { PriceData, CandleData, Period } from "./price-service";

export { financialService, FinancialService } from "./financial-service";
export type { Financials, ValuationMetrics } from "./financial-service";

export { analystService, AnalystService } from "./analyst-service";
export type { AnalystReportData, ConsensusData } from "./analyst-service";

// =============================================================================
// 실제 API 서비스
// =============================================================================

// DART OpenAPI (금융감독원 전자공시시스템)
export { dartService, DartService } from "./dart-service";
export type {
    CompanyInfo,
    FinancialStatement,
    DisclosureInfo,
    FinancialRatios,
} from "./dart-service";

// 한국투자증권 KIS OpenAPI
export { kisService, KisService } from "./kis-service";
export type {
    CurrentPrice,
    DailyPrice,
    OrderBook,
    AccountBalance,
    AccountHolding,
    OrderResult,
} from "./kis-service";

// =============================================================================
// 크롤러 서비스
// =============================================================================

// 토스증권 크롤러
export { tossCrawler, TossCrawler } from "./toss-crawler";
export type { TossStockInfo, TossChartData, TossOrderBook } from "./toss-crawler";

// 네이버 금융 크롤러
export { naverCrawler, NaverCrawler } from "./naver-crawler";
export type {
    NaverAnalystReport,
    NaverTargetPrice,
    NaverNews,
    NaverStockOverview,
    NaverConsensus,
} from "./naver-crawler";

// 세이브로 크롤러 (금융투자협회)
export { seibroCrawler, SeibroCrawler } from "./seibro-crawler";
export type { SebroReport, SebroRecommendation, SebroConsensus } from "./seibro-crawler";
