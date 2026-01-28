/**
 * Summary Agent
 * 요약 분석을 위한 Agent - 여러 Skill을 조합하여 종합 요약 생성
 * 
 * @module summary/agent
 */

import type { BaseAgent, AnalysisContext, SummaryAnalysis } from "@/types";

/**
 * 요약 분석 Agent
 * - PerformanceEvaluator: 성과 평가
 * - CharacteristicsAnalyzer: 종목 특성 분석
 */
export class SummaryAgent implements BaseAgent<AnalysisContext, SummaryAnalysis> {
    // TODO: Skill 인스턴스 주입

    /**
     * 종합 요약 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<SummaryAnalysis> {
        // TODO: 구현 예정
        // 1. PerformanceEvaluator로 성과 평가
        // 2. CharacteristicsAnalyzer로 종목 특성 분석
        // 3. 밸류에이션 데이터 조회
        // 4. 결과 통합
        throw new Error("Not implemented");
    }
}

export const summaryAgent = new SummaryAgent();
