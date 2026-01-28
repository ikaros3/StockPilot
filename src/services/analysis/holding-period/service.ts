/**
 * Holding Period Service
 * 보유기간 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module holding-period
 */

import type { AnalysisContext, HoldingPeriodAnalysis } from "@/types";
import { holdingPeriodAgent } from "./agent/holding-period-agent";

/**
 * 보유 기간 서비스
 */
export class HoldingPeriodService {
    /**
     * 보유 기간 분석 수행
     */
    async getHoldingPeriodAnalysis(context: AnalysisContext): Promise<HoldingPeriodAnalysis> {
        return holdingPeriodAgent.analyze(context);
    }

    /**
     * 이벤트 스케줄 조회
     */
    async getEventSchedule(stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 이벤트 조회
        throw new Error("Not implemented");
    }
}

export const holdingPeriodService = new HoldingPeriodService();
