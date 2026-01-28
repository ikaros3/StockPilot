/**
 * Accumulation Service
 * 추가매수 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module accumulation
 */

import type { AnalysisContext, AccumulationAnalysis } from "@/types";
import { accumulationAgent } from "./agent/accumulation-agent";

/**
 * 추가 매수 서비스
 */
export class AccumulationService {
    /**
     * 추가 매수 분석 수행
     */
    async getAccumulationAnalysis(context: AnalysisContext): Promise<AccumulationAnalysis> {
        return accumulationAgent.analyze(context);
    }

    /**
     * 매수 신호 조회
     */
    async getBuySignals(stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 신호 조회
        throw new Error("Not implemented");
    }
}

export const accumulationService = new AccumulationService();
