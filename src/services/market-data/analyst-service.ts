import type { InvestmentOpinion } from "@/types";

/**
 * 애널리스트 리포트 요약
 */
export interface AnalystReportData {
    firm: string;
    analystName?: string;
    date: string;
    opinion: InvestmentOpinion;
    targetPrice: number;
    previousTargetPrice?: number;
    keyPoints: string[];
    reportUrl?: string;
}

/**
 * 컨센서스 데이터
 */
export interface ConsensusData {
    averageTargetPrice: number;
    highTargetPrice: number;
    lowTargetPrice: number;
    targetPriceCount: number;
    opinionDistribution: Record<InvestmentOpinion, number>;
}

/**
 * 애널리스트 서비스
 * 증권사 리포트 및 컨센서스 데이터를 제공합니다.
 */
export class AnalystService {
    /**
     * 애널리스트 리포트 조회 (모의 데이터)
     */
    async getReports(stockCode: string): Promise<AnalystReportData[]> {
        // 실제로는 네이버 금융, 세이브로 크롤링
        const mockReports: AnalystReportData[] = [
            {
                firm: "삼성증권",
                analystName: "김ㅇㅇ",
                date: "2026.01.15",
                opinion: "buy",
                targetPrice: 95000,
                previousTargetPrice: 90000,
                keyPoints: ["HBM 수요 증가", "파운드리 수주 확대", "D램 가격 반등"],
            },
            {
                firm: "한국투자증권",
                analystName: "이ㅇㅇ",
                date: "2026.01.12",
                opinion: "buy",
                targetPrice: 92000,
                keyPoints: ["메모리 가격 반등", "D램 시장점유율 확대"],
            },
            {
                firm: "미래에셋증권",
                analystName: "박ㅇㅇ",
                date: "2026.01.10",
                opinion: "hold",
                targetPrice: 85000,
                keyPoints: ["경기 불확실성 지속", "중국 리스크 주시 필요"],
            },
            {
                firm: "KB증권",
                analystName: "최ㅇㅇ",
                date: "2026.01.08",
                opinion: "strong_buy",
                targetPrice: 100000,
                previousTargetPrice: 95000,
                keyPoints: ["AI 반도체 수요 폭발", "시장 지배력 강화"],
            },
            {
                firm: "NH투자증권",
                analystName: "정ㅇㅇ",
                date: "2026.01.05",
                opinion: "buy",
                targetPrice: 90000,
                keyPoints: ["2026년 실적 턴어라운드", "배당 매력 부각"],
            },
        ];

        return mockReports;
    }

    /**
     * 컨센서스 데이터 계산
     */
    async getConsensus(stockCode: string): Promise<ConsensusData> {
        const reports = await this.getReports(stockCode);

        const targetPrices = reports.map(r => r.targetPrice);
        const averageTargetPrice = Math.round(
            targetPrices.reduce((sum, p) => sum + p, 0) / targetPrices.length
        );

        // 의견 분포 계산
        const opinionCounts: Record<InvestmentOpinion, number> = {
            strong_buy: 0,
            buy: 0,
            hold: 0,
            sell: 0,
            strong_sell: 0,
        };

        reports.forEach(report => {
            opinionCounts[report.opinion]++;
        });

        const total = reports.length;
        const opinionDistribution: Record<InvestmentOpinion, number> = {
            strong_buy: Math.round((opinionCounts.strong_buy / total) * 100),
            buy: Math.round((opinionCounts.buy / total) * 100),
            hold: Math.round((opinionCounts.hold / total) * 100),
            sell: Math.round((opinionCounts.sell / total) * 100),
            strong_sell: Math.round((opinionCounts.strong_sell / total) * 100),
        };

        return {
            averageTargetPrice,
            highTargetPrice: Math.max(...targetPrices),
            lowTargetPrice: Math.min(...targetPrices),
            targetPriceCount: targetPrices.length,
            opinionDistribution,
        };
    }

    /**
     * 상방/하방 여력 계산
     */
    calculatePotential(currentPrice: number, consensus: ConsensusData) {
        const upside = ((consensus.averageTargetPrice - currentPrice) / currentPrice) * 100;
        const downside = ((currentPrice - consensus.lowTargetPrice) / currentPrice) * 100;

        return {
            upsidePotential: Math.max(0, upside),
            downsideRisk: Math.max(0, downside),
        };
    }
}

export const analystService = new AnalystService();
