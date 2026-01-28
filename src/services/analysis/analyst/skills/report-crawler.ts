/**
 * Report Crawler Skill
 * 증권사 애널리스트 리포트 수집
 * 
 * @module analyst/skills
 */

import type { BaseSkill, AnalystReportSummary } from "@/types";

interface CrawlerInput {
    stockCode: string;
    limit?: number;
}

interface CrawlerOutput {
    reports: AnalystReportSummary[];
    crawledAt: Date;
}

/**
 * 리포트 크롤러 Skill
 */
export class ReportCrawler implements BaseSkill<CrawlerInput, CrawlerOutput> {
    /**
     * 리포트 수집 실행
     */
    async execute(input: CrawlerInput): Promise<CrawlerOutput> {
        // TODO: 구현 예정
        // 1. 한경컨센서스 API 호출
        // 2. 증권사 사이트 크롤링
        // 3. DART 공시 조회
        // 4. 결과 정규화
        throw new Error("Not implemented");
    }
}

export const reportCrawler = new ReportCrawler();
