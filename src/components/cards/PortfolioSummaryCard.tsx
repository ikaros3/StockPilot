"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PerformanceGrade } from "@/types";

interface PortfolioSummaryCardProps {
    totalInvestment: number;
    currentValue: number;
    totalProfit: number;
    profitRate: number;
    holdingCount: number;
    performanceGrade: PerformanceGrade;
}

const gradeLabels: Record<PerformanceGrade, string> = {
    excellent: "매우 우수",
    good: "우수",
    average: "보통",
    warning: "주의",
    poor: "미흡",
    critical: "위험",
};

const gradeColors: Record<PerformanceGrade, string> = {
    excellent: "bg-profit text-profit-foreground",
    good: "bg-green-500 text-white",
    average: "bg-yellow-500 text-white",
    warning: "bg-orange-500 text-white",
    poor: "bg-red-400 text-white",
    critical: "bg-red-600 text-white",
};

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function PortfolioSummaryCard({
    totalInvestment,
    currentValue,
    totalProfit,
    profitRate,
    holdingCount,
    performanceGrade,
}: PortfolioSummaryCardProps) {
    const isProfit = profitRate >= 0;
    const isNeutral = profitRate === 0;

    const TrendIcon = isNeutral ? Minus : isProfit ? TrendingUp : TrendingDown;
    const trendColor = isNeutral
        ? "text-muted-foreground"
        : isProfit
            ? "text-profit"
            : "text-loss";

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">포트폴리오 요약</CardTitle>
                <Badge className={cn("font-medium", gradeColors[performanceGrade])}>
                    {gradeLabels[performanceGrade]}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">총 투자액</p>
                        <p className="text-xl font-bold">{formatKRW(totalInvestment)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">현재 평가액</p>
                        <p className="text-xl font-bold">{formatKRW(currentValue)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                        <p className="text-sm text-muted-foreground">총 수익</p>
                        <div className="flex items-center gap-2">
                            <p className={cn("text-2xl font-bold", trendColor)}>
                                {formatKRW(totalProfit)}
                            </p>
                            <div className={cn("flex items-center gap-1", trendColor)}>
                                <TrendIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {isProfit ? "+" : ""}
                                    {profitRate.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">보유 종목</p>
                        <p className="text-2xl font-bold">{holdingCount}개</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
