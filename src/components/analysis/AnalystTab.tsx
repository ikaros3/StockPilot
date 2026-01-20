"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, TrendingDown, BarChart3, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalystData } from "@/hooks/useStockData";

interface AnalystTabProps {
    stockId: string;
}

// 종목코드 매핑
const stockCodeMap: Record<string, string> = {
    "1": "005930",
    "2": "000660",
    "3": "035720",
    "4": "005380",
};

const opinionLabels: Record<string, string> = {
    strong_buy: "강력 매수",
    buy: "매수",
    hold: "보유",
    sell: "매도",
    strong_sell: "강력 매도",
};

const opinionColors: Record<string, string> = {
    strong_buy: "bg-profit text-profit-foreground",
    buy: "bg-profit/80 text-profit-foreground",
    hold: "bg-yellow-500 text-white",
    sell: "bg-loss/80 text-loss-foreground",
    strong_sell: "bg-loss text-loss-foreground",
};

// 투자의견 변환 함수
function mapOpinion(opinion: string): keyof typeof opinionLabels {
    const lowerOpinion = opinion.toLowerCase();
    if (lowerOpinion.includes("strong buy") || lowerOpinion.includes("적극매수")) return "strong_buy";
    if (lowerOpinion.includes("buy") || lowerOpinion.includes("매수")) return "buy";
    if (lowerOpinion.includes("sell") || lowerOpinion.includes("매도")) return "sell";
    if (lowerOpinion.includes("strong sell") || lowerOpinion.includes("적극매도")) return "strong_sell";
    return "hold";
}

export function AnalystTab({ stockId }: AnalystTabProps) {
    const stockCode = stockCodeMap[stockId] || stockId;
    const { reports, consensus, isLoading, isError } = useAnalystData(stockCode);

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 에러 또는 데이터 없음
    if (isError || !reports) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-2">애널리스트 데이터를 불러올 수 없습니다.</p>
                        <p className="text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 컨센서스 데이터 계산
    const consensusData = consensus || {
        averageTargetPrice: 0,
        highTargetPrice: 0,
        lowTargetPrice: 0,
        upside: 0,
        reportCount: reports.length,
        buyCount: 0,
    };

    // 투자의견 분포 계산
    const opinionDistribution = {
        strong_buy: 0,
        buy: 0,
        hold: 0,
        sell: 0,
        strong_sell: 0,
    };

    reports.forEach((report: { opinion?: string }) => {
        if (report.opinion) {
            const mapped = mapOpinion(report.opinion);
            (opinionDistribution as Record<string, number>)[mapped]++;
        }
    });

    const totalOpinions = Object.values(opinionDistribution).reduce((a, b) => a + b, 0);
    const opinionPercentages = Object.fromEntries(
        Object.entries(opinionDistribution).map(([key, value]) => [
            key,
            totalOpinions > 0 ? Math.round((value / totalOpinions) * 100) : 0,
        ])
    );

    return (
        <div className="space-y-6">
            {/* 컨센서스 요약 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        컨센서스 요약
                        <span className="text-xs text-green-500 font-normal">● 실시간</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 목표가 */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">최저 목표가</span>
                            <p className="text-xl font-bold">
                                ₩{(consensusData.lowTargetPrice || consensusData.averageTargetPrice * 0.9).toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm text-muted-foreground">평균 목표가</span>
                            <p className="text-2xl font-bold text-primary">
                                ₩{consensusData.averageTargetPrice.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">최고 목표가</span>
                            <p className="text-xl font-bold">
                                ₩{(consensusData.highTargetPrice || consensusData.averageTargetPrice * 1.1).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* 상방/하방 여력 */}
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-profit" />
                            <span className="text-sm text-muted-foreground">상방 여력</span>
                            <span className="text-xl font-bold text-profit">
                                {consensusData.upside >= 0 ? "+" : ""}{consensusData.upside.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">리포트 수</span>
                            <span className="text-xl font-bold">{consensusData.reportCount}건</span>
                        </div>
                    </div>

                    {/* 투자 의견 분포 */}
                    {totalOpinions > 0 && (
                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">투자 의견 분포</span>
                            <div className="flex h-6 rounded-full overflow-hidden">
                                {Object.entries(opinionPercentages)
                                    .filter(([, value]) => value > 0)
                                    .map(([opinion, value]) => (
                                        <div
                                            key={opinion}
                                            className={cn(opinionColors[opinion])}
                                            style={{ width: `${value}%` }}
                                        />
                                    ))}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {Object.entries(opinionPercentages)
                                    .filter(([, value]) => value > 0)
                                    .map(([opinion, value]) => (
                                        <div key={opinion} className="flex items-center gap-1 text-xs">
                                            <div className={cn("w-3 h-3 rounded", opinionColors[opinion])} />
                                            <span>{opinionLabels[opinion]}: {value}%</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 최근 리포트 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        최근 애널리스트 리포트
                        <Badge variant="outline" className="ml-2">{reports.length}건</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            최근 애널리스트 리포트가 없습니다.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {reports.slice(0, 10).map((report: {
                                id?: string;
                                date: string;
                                firm: string;
                                title: string;
                                opinion?: string;
                                targetPrice: number;
                                url?: string;
                            }, i: number) => {
                                const mappedOpinion = report.opinion ? mapOpinion(report.opinion) : "hold";
                                return (
                                    <div key={report.id || i} className="p-4 border rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{report.firm}</span>
                                                <span className="text-sm text-muted-foreground">{report.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {report.opinion && (
                                                    <Badge className={opinionColors[mappedOpinion]}>
                                                        {opinionLabels[mappedOpinion]}
                                                    </Badge>
                                                )}
                                                {report.targetPrice > 0 && (
                                                    <span className="font-bold">₩{report.targetPrice.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{report.title}</p>
                                        {report.url && (
                                            <a
                                                href={report.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                리포트 보기
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
