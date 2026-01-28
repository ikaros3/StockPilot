/**
 * Exit Timing Service
 * 매도타이밍 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module exit-timing
 */

import type { AnalysisContext, ExitTimingAnalysis } from "@/types";
import { exitTimingAgent } from "./agent/exit-timing-agent";

/**
 * 매도 타이밍 서비스
 */
export class ExitTimingService {
    /**
     * 매도 타이밍 분석 수행
     */
    async getExitTimingAnalysis(context: AnalysisContext): Promise<ExitTimingAnalysis> {
        return exitTimingAgent.analyze(context);
    }

    /**
     * 실시간 매도 신호 조회
     */
    async getSellSignals(stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 신호 조회
        throw new Error("Not implemented");
    }
}

export const exitTimingService = new ExitTimingService();
