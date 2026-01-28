/**
 * Summary Service
 * 요약 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module summary
 */

import type { AnalysisContext, SummaryAnalysis } from "@/types";
import { summaryAgent } from "./agent/summary-agent";

/**
 * 요약 분석 서비스
 */
export class SummaryService {
    /**
     * 요약 분석 수행
     */
    async getSummaryAnalysis(context: AnalysisContext): Promise<SummaryAnalysis> {
        // TODO: 구현 예정
        // Agent를 통해 분석 수행
        return summaryAgent.analyze(context);
    }

    /**
     * 캐시된 요약 데이터 조회
     */
    async getCachedSummary(stockCode: string): Promise<SummaryAnalysis | null> {
        // TODO: Firestore에서 캐시 조회
        throw new Error("Not implemented");
    }
}

export const summaryService = new SummaryService();
