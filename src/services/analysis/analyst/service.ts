/**
 * Analyst Service
 * 애널리스트 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module analyst
 */

import type { AnalysisContext, AnalystInsightAnalysis } from "@/types";
import { analystAgent } from "./agent/analyst-agent";

/**
 * 애널리스트 분석 서비스
 */
export class AnalystService {
    /**
     * 애널리스트 분석 수행
     */
    async getAnalystInsight(context: AnalysisContext): Promise<AnalystInsightAnalysis> {
        // TODO: 구현 예정
        return analystAgent.analyze(context);
    }

    /**
     * 최신 리포트 조회
     */
    async getLatestReports(stockCode: string, limit?: number): Promise<unknown[]> {
        // TODO: Firestore에서 리포트 조회
        throw new Error("Not implemented");
    }

    /**
     * 컨센서스 데이터 조회
     */
    async getConsensus(stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 컨센서스 조회
        throw new Error("Not implemented");
    }
}

export const analystService = new AnalystService();
