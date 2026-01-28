/**
 * Performance Evaluator Skill
 * 현재 성과 평가 및 목표가 진행률 계산
 * 
 * @module summary/skills
 */

import type { BaseSkill } from "@/types";

interface PerformanceInput {
    stockName: string;
    purchasePrice: number;
    currentPrice: number;
    targetPrice: number;
}

interface PerformanceOutput {
    performanceText: string;
    targetProgress: number;
    profitRate: number;
}

/**
 * 성과 평가 Skill
 */
export class PerformanceEvaluator implements BaseSkill<PerformanceInput, PerformanceOutput> {
    /**
     * 성과 평가 실행
     */
    async execute(input: PerformanceInput): Promise<PerformanceOutput> {
        // TODO: 구현 예정
        // 1. 수익률 계산
        // 2. 목표가 대비 진행률 계산
        // 3. 성과 평가 텍스트 생성
        throw new Error("Not implemented");
    }
}

export const performanceEvaluator = new PerformanceEvaluator();
