/**
 * Consensus Calculator Skill
 * 애널리스트 컨센서스 계산 (평균 목표가, 투자 의견 분포)
 * 
 * @module analyst/skills
 */

import type { BaseSkill, ConsensusData, AnalystReportSummary } from "@/types";

interface ConsensusInput {
    reports: AnalystReportSummary[];
    currentPrice: number;
}

/**
 * 컨센서스 계산 Skill
 */
export class ConsensusCalculator implements BaseSkill<ConsensusInput, ConsensusData> {
    /**
     * 컨센서스 계산 실행
     */
    async execute(input: ConsensusInput): Promise<ConsensusData> {
        // TODO: 구현 예정
        // 1. 평균/최고/최저 목표가 계산
        // 2. 투자 의견 분포 집계
        // 3. 상방 여력/하방 리스크 계산
        throw new Error("Not implemented");
    }
}

export const consensusCalculator = new ConsensusCalculator();
