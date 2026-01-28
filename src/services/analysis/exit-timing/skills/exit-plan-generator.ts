/**
 * Exit Plan Generator Skill
 * 분할 매도 계획 생성 (1차/2차/3차 익절)
 * 
 * @module exit-timing/skills
 */

import type { BaseSkill, ExitStrategy } from "@/types";

interface ExitPlanInput {
    purchasePrice: number;
    currentPrice: number;
    quantity: number;
    targetReturn?: number;
}

interface ExitPlanOutput {
    firstExitStrategy: ExitStrategy;
    secondExitStrategy: ExitStrategy;
    recommendation: string;
}

/**
 * 분할 매도 계획 생성 Skill
 */
export class ExitPlanGenerator implements BaseSkill<ExitPlanInput, ExitPlanOutput> {
    /**
     * 분할 매도 계획 생성 실행
     */
    async execute(input: ExitPlanInput): Promise<ExitPlanOutput> {
        // TODO: 구현 예정
        // 1. 1차 익절가 계산 (기본 15%)
        // 2. 2차 익절가 계산 (기본 30%)
        // 3. 매도 수량 비율 계산
        // 4. 추천 문구 생성
        throw new Error("Not implemented");
    }
}

export const exitPlanGenerator = new ExitPlanGenerator();
