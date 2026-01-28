/**
 * Trading Strategy Service
 * 매매전략 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module trading-strategy
 */

import type { AnalysisContext, TradingStrategyAnalysis } from "@/types";
import { strategyAgent } from "./agent/strategy-agent";

/**
 * 매매 전략 서비스
 */
export class TradingStrategyService {
    /**
     * 매매 전략 분석 수행
     */
    async getTradingStrategy(context: AnalysisContext): Promise<TradingStrategyAnalysis> {
        // TODO: 구현 예정
        return strategyAgent.analyze(context);
    }

    /**
     * 백테스트 결과 조회
     */
    async getBacktestResults(stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 백테스트 결과 조회
        throw new Error("Not implemented");
    }
}

export const tradingStrategyService = new TradingStrategyService();
