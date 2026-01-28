/**
 * Report Summarizer Skill
 * AI 기반 리포트 요약 (Claude API 연동)
 * 
 * @module analyst/skills
 */

import type { BaseSkill } from "@/types";

interface SummarizerInput {
    reportText: string;
    stockCode: string;
    stockName: string;
}

interface SummarizerOutput {
    summary: string;
    keyPoints: string[];
    sentiment: "positive" | "neutral" | "negative";
}

/**
 * 리포트 요약 Skill (AI 연동)
 */
export class ReportSummarizer implements BaseSkill<SummarizerInput, SummarizerOutput> {
    /**
     * 리포트 요약 실행
     */
    async execute(input: SummarizerInput): Promise<SummarizerOutput> {
        // TODO: 구현 예정
        // 1. Cloud Run AI 서버 호출
        // 2. Claude API로 텍스트 분석
        // 3. 핵심 포인트 추출
        // 4. 감성 분석 (긍정/중립/부정)
        throw new Error("Not implemented");
    }
}

export const reportSummarizer = new ReportSummarizer();
