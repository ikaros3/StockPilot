import { Timestamp } from "firebase/firestore";

/**
 * 포트폴리오
 */
export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    description?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * 포트폴리오 생성 입력
 */
export interface CreatePortfolioInput {
    userId: string;
    name: string;
    description?: string;
}

/**
 * 추가 매수 이력
 */
export interface AdditionalPurchase {
    price: number;
    quantity: number;
    date: Timestamp;
}

/**
 * 보유 종목
 */
export interface Holding {
    id: string;
    portfolioId: string;
    stockCode: string;
    stockName: string;
    purchasePrice: number;     // 평균 매수가
    quantity: number;          // 총 보유 수량
    purchaseDate: Timestamp;   // 최초 매수일
    additionalPurchases: AdditionalPurchase[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * 보유 종목 생성 입력
 */
export interface CreateHoldingInput {
    portfolioId: string;
    stockCode: string;
    stockName: string;
    purchasePrice: number;
    quantity: number;
    purchaseDate: Date;
}

/**
 * 종목 성과 상태
 */
export type PerformanceStatus = "bullish" | "neutral" | "bearish";

/**
 * 포트폴리오 성과 등급
 */
export type PerformanceGrade = "excellent" | "good" | "average" | "warning";

/**
 * 포트폴리오 요약
 */
export interface PortfolioSummary {
    totalInvestment: number;     // 총 투자액
    currentValue: number;        // 현재 평가액
    totalProfit: number;         // 총 수익금
    profitRate: number;          // 수익률 (%)
    holdingCount: number;        // 보유 종목 수
    performanceGrade: PerformanceGrade;
}

/**
 * 종목 카드 정보
 */
export interface StockCardInfo {
    holding: Holding;
    currentPrice: number;
    evaluationAmount: number;
    profit: number;
    profitRate: number;
    performanceStatus: PerformanceStatus;
}
