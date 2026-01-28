/**
 * Accumulation Agent
 * 추가 매수 분석을 위한 Agent
 * 
 * @module accumulation/agent
 */

import type { BaseAgent, AnalysisContext, AccumulationAnalysis } from "@/types";

/**
 * 추가 매수 Agent
 * - BuySignalDetector: 매수 신호 감지
 * - PositionCalculator: 포지션 계산
 */
export class AccumulationAgent implements BaseAgent<AnalysisContext, AccumulationAnalysis> {
    /**
     * 추가 매수 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<AccumulationAnalysis> {
        // TODO: 구현 예정
        // 1. BuySignalDetector로 매수 신호 감지
        // 2. PositionCalculator로 매수 금액/수량 계산
        throw new Error("Not implemented");
    }
}

export const accumulationAgent = new AccumulationAgent();
