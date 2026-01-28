/**
 * Exit Timing Agent
 * 매도 타이밍 분석을 위한 Agent
 * 
 * @module exit-timing/agent
 */

import type { BaseAgent, AnalysisContext, ExitTimingAnalysis } from "@/types";

/**
 * 매도 타이밍 Agent
 * - SignalDetector: 매도 신호 감지
 * - ExitPlanGenerator: 분할 매도 계획 생성
 */
export class ExitTimingAgent implements BaseAgent<AnalysisContext, ExitTimingAnalysis> {
    /**
     * 매도 타이밍 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<ExitTimingAnalysis> {
        // TODO: 구현 예정
        // 1. SignalDetector로 매도 신호 감지
        // 2. ExitPlanGenerator로 분할 매도 계획 생성
        throw new Error("Not implemented");
    }
}

export const exitTimingAgent = new ExitTimingAgent();
