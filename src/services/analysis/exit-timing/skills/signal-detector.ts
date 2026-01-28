/**
 * Signal Detector Skill
 * 매도 신호 감지 (목표가 도달, RSI 과매수, 데드크로스 등)
 * 
 * @module exit-timing/skills
 */

import type { BaseSkill } from "@/types";

interface SignalInput {
    stockCode: string;
    currentPrice: number;
    targetPrice: number;
}

interface SellSignal {
    type: "target_price" | "technical" | "supply_demand" | "valuation";
    description: string;
    urgency: "high" | "medium" | "low";
    triggeredAt: Date;
}

interface SignalOutput {
    signals: SellSignal[];
    overallUrgency: "high" | "medium" | "low";
}

/**
 * 매도 신호 감지 Skill
 */
export class SignalDetector implements BaseSkill<SignalInput, SignalOutput> {
    /**
     * 매도 신호 감지 실행
     */
    async execute(input: SignalInput): Promise<SignalOutput> {
        // TODO: 구현 예정
        // 1. 목표가 도달 체크
        // 2. RSI 과매수 체크 (> 70)
        // 3. MACD 데드크로스 체크
        // 4. 외국인/기관 순매도 체크
        throw new Error("Not implemented");
    }
}

export const signalDetector = new SignalDetector();
