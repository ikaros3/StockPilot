/**
 * Backtest Runner Skill
 * 전략 백테스트 실행 (Cloud Run AI 서버 연동)
 * 
 * @module trading-strategy/skills
 */

import type { BaseSkill, StrategyType } from "@/types";

interface BacktestInput {
    stockCode: string;
    strategyType: StrategyType;
    startDate: string;
    endDate: string;
    initialCapital: number;
}

interface BacktestOutput {
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalTrades: number;
}

/**
 * 백테스트 실행 Skill
 */
export class BacktestRunner implements BaseSkill<BacktestInput, BacktestOutput> {
    /**
     * 백테스트 실행
     */
    async execute(input: BacktestInput): Promise<BacktestOutput> {
        // TODO: 구현 예정
        // 1. Cloud Run AI 서버 호출 (/backtest)
        // 2. 가격 데이터 전송
        // 3. 전략 파라미터 전송
        // 4. 백테스트 결과 수신
        throw new Error("Not implemented");
    }
}

export const backtestRunner = new BacktestRunner();
