/**
 * Strategy Agent
 * 매매 전략 분석을 위한 Agent - 시장 분석, 백테스트, 전략 생성
 * 
 * @module trading-strategy/agent
 */

import type { BaseAgent, AnalysisContext, TradingStrategyAnalysis } from "@/types";

/**
 * 매매 전략 Agent
 * - MarketAnalyzer: 시장 상황 분석
 * - BacktestRunner: 전략 백테스트
 * - StrategyGenerator: 최적 전략 생성
 */
export class StrategyAgent implements BaseAgent<AnalysisContext, TradingStrategyAnalysis> {
    // TODO: Skill 인스턴스 주입

    /**
     * 매매 전략 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<TradingStrategyAnalysis> {
        // TODO: 구현 예정
        // 1. MarketAnalyzer로 시장 상황 분석
        // 2. StrategyGenerator로 전략 생성
        // 3. BacktestRunner로 백테스트 실행
        // 4. 결과 통합
        throw new Error("Not implemented");
    }
}

export const strategyAgent = new StrategyAgent();
