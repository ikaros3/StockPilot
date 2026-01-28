/**
 * Risk Control Service
 * 익절/손절 탭 컴포넌트에서 호출하는 메인 서비스
 * 
 * @module risk-control
 */

import type { AnalysisContext, RiskControlAnalysis } from "@/types";
import { riskControlAgent } from "./agent/risk-control-agent";

/**
 * 리스크 관리 서비스
 */
export class RiskControlService {
    /**
     * 리스크 관리 분석 수행
     */
    async getRiskControlAnalysis(context: AnalysisContext): Promise<RiskControlAnalysis> {
        return riskControlAgent.analyze(context);
    }

    /**
     * 익절/손절 설정 조회
     */
    async getProfitLossRules(userId: string, stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 설정 조회
        throw new Error("Not implemented");
    }

    /**
     * 트레일링 스탑 상태 조회
     */
    async getTrailingStopStatus(userId: string, stockCode: string): Promise<unknown> {
        // TODO: Firestore에서 상태 조회
        throw new Error("Not implemented");
    }
}

export const riskControlService = new RiskControlService();
