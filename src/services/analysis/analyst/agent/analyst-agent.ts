/**
 * Analyst Agent
 * 애널리스트 분석을 위한 Agent - 리포트 수집, 요약, 컨센서스 계산
 * 
 * @module analyst/agent
 */

import type { BaseAgent, AnalysisContext, AnalystInsightAnalysis } from "@/types";

/**
 * 애널리스트 분석 Agent
 * - ReportCrawler: 리포트 수집
 * - ReportSummarizer: AI 기반 리포트 요약
 * - ConsensusCalculator: 컨센서스 계산
 */
export class AnalystAgent implements BaseAgent<AnalysisContext, AnalystInsightAnalysis> {
    // TODO: Skill 인스턴스 주입

    /**
     * 애널리스트 분석 수행
     */
    async analyze(context: AnalysisContext): Promise<AnalystInsightAnalysis> {
        // TODO: 구현 예정
        // 1. ReportCrawler로 최신 리포트 수집
        // 2. ReportSummarizer로 AI 요약 생성 (Claude API)
        // 3. ConsensusCalculator로 컨센서스 계산
        // 4. 결과 통합
        throw new Error("Not implemented");
    }
}

export const analystAgent = new AnalystAgent();
