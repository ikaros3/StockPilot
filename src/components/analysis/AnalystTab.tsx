"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalystTabProps {
    stockId: string;
}

// 임시 데이터
const analystData = {
    reports: [
        { firm: "삼성증권", date: "2026.01.15", opinion: "buy" as const, targetPrice: 95000, keyPoints: ["HBM 수요 증가", "파운드리 수주 확대"] },
        { firm: "한국투자증권", date: "2026.01.12", opinion: "buy" as const, targetPrice: 92000, keyPoints: ["메모리 가격 반등", "D램 선두 유지"] },
        { firm: "미래에셋증권", date: "2026.01.10", opinion: "hold" as const, targetPrice: 85000, keyPoints: ["경기 불확실성", "중국 리스크"] },
        { firm: "KB증권", date: "2026.01.08", opinion: "strong_buy" as const, targetPrice: 100000, keyPoints: ["AI 반도체 성장", "시장 지배력 강화"] },
    ],
    consensus: {
        averageTargetPrice: 93000,
        highTargetPrice: 100000,
        lowTargetPrice: 85000,
        currentPrice: 78000,
        upsidePotential: 19.2,
        downsideRisk: 8.9,
        opinionDistribution: {
            strong_buy: 20,
            buy: 50,
            hold: 25,
            sell: 5,
            strong_sell: 0,
        },
    },
};

const opinionLabels = {
    strong_buy: "강력 매수",
    buy: "매수",
    hold: "보유",
    sell: "매도",
    strong_sell: "강력 매도",
};

const opinionColors = {
    strong_buy: "bg-profit text-profit-foreground",
    buy: "bg-profit/80 text-profit-foreground",
    hold: "bg-yellow-500 text-white",
    sell: "bg-loss/80 text-loss-foreground",
    strong_sell: "bg-loss text-loss-foreground",
};

export function AnalystTab({ stockId }: AnalystTabProps) {
    return (
        <div className="space-y-6">
            {/* 컨센서스 요약 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        컨센서스 요약
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 목표가 */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">최저 목표가</span>
                            <p className="text-xl font-bold">₩{analystData.consensus.lowTargetPrice.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm text-muted-foreground">평균 목표가</span>
                            <p className="text-2xl font-bold text-primary">₩{analystData.consensus.averageTargetPrice.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">최고 목표가</span>
                            <p className="text-xl font-bold">₩{analystData.consensus.highTargetPrice.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* 상방/하방 여력 */}
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-profit" />
                            <span className="text-sm text-muted-foreground">상방 여력</span>
                            <span className="text-xl font-bold text-profit">+{analystData.consensus.upsidePotential}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-loss" />
                            <span className="text-sm text-muted-foreground">하방 리스크</span>
                            <span className="text-xl font-bold text-loss">-{analystData.consensus.downsideRisk}%</span>
                        </div>
                    </div>

                    {/* 투자 의견 분포 */}
                    <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">투자 의견 분포</span>
                        <div className="flex h-6 rounded-full overflow-hidden">
                            {Object.entries(analystData.consensus.opinionDistribution)
                                .filter(([, value]) => value > 0)
                                .map(([opinion, value]) => (
                                    <div
                                        key={opinion}
                                        className={cn(opinionColors[opinion as keyof typeof opinionColors])}
                                        style={{ width: `${value}%` }}
                                    />
                                ))}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {Object.entries(analystData.consensus.opinionDistribution)
                                .filter(([, value]) => value > 0)
                                .map(([opinion, value]) => (
                                    <div key={opinion} className="flex items-center gap-1 text-xs">
                                        <div className={cn("w-3 h-3 rounded", opinionColors[opinion as keyof typeof opinionColors])} />
                                        <span>{opinionLabels[opinion as keyof typeof opinionLabels]}: {value}%</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 최근 리포트 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        최근 애널리스트 리포트
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analystData.reports.map((report, i) => (
                            <div key={i} className="p-4 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">{report.firm}</span>
                                        <span className="text-sm text-muted-foreground">{report.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={opinionColors[report.opinion]}>
                                            {opinionLabels[report.opinion]}
                                        </Badge>
                                        <span className="font-bold">₩{report.targetPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {report.keyPoints.map((point, j) => (
                                        <Badge key={j} variant="outline">{point}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
