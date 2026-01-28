/**
 * Risk Control Agent
 * 익절/손절 관리를 위한 Agent
 * 
 * @module risk-control/agent
 */

import type { BaseAgent, AnalysisContext, RiskControlAnalysis } from "@/types";

/**
 * 리스크 관리 Agent
 * - StopLossCalculator: 손절가 계산
 * - TrailingStopManager: 트레일링 스탑 관리
 */
export class RiskControlAgent implements BaseAgent<AnalysisContext, RiskControlAnalysis> {
    /**
     * 리스크 관리 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<RiskControlAnalysis> {
        // TODO: 구현 예정
        // 1. StopLossCalculator로 손절가 계산
        // 2. TrailingStopManager로 트레일링 스탑 설정
        // 3. 리스크 요인 분석
        throw new Error("Not implemented");
    }
}

export const riskControlAgent = new RiskControlAgent();
