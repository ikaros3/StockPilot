/**
 * Trailing Stop Manager Skill
 * 트레일링 스탑 관리 (최고가 추적, 동적 손절가 조정)
 * 
 * @module risk-control/skills
 */

import type { BaseSkill } from "@/types";

interface TrailingInput {
    purchasePrice: number;
    currentPrice: number;
    highestPrice: number;
    trailingPercentage: number;
}

interface TrailingOutput {
    isEnabled: boolean;
    highestPrice: number;
    currentStopPrice: number;
    isTriggered: boolean;
    triggerDistance: number; // 현재가와 스탑가 차이 (%)
}

/**
 * 트레일링 스탑 관리 Skill
 */
export class TrailingStopManager implements BaseSkill<TrailingInput, TrailingOutput> {
    /**
     * 트레일링 스탑 관리 실행
     */
    async execute(input: TrailingInput): Promise<TrailingOutput> {
        // TODO: 구현 예정
        // 1. 최고가 업데이트
        // 2. 동적 손절가 계산
        // 3. 트리거 여부 체크
        // 4. FCM 알림 트리거
        throw new Error("Not implemented");
    }
}

export const trailingStopManager = new TrailingStopManager();
