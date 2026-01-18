"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PerformanceStatus } from "@/types";

interface StockCardProps {
    id: string;
    stockCode: string;
    stockName: string;
    currentPrice: number;
    purchasePrice: number;
    quantity: number;
    evaluationAmount: number;
    profit: number;
    profitRate: number;
    performanceStatus: PerformanceStatus;
}

const statusLabels: Record<PerformanceStatus, string> = {
    bullish: "강세",
    neutral: "중립",
    bearish: "약세",
};

const statusColors: Record<PerformanceStatus, string> = {
    bullish: "bg-profit/10 text-profit border-profit/20",
    neutral: "bg-muted text-muted-foreground",
    bearish: "bg-loss/10 text-loss border-loss/20",
};

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function StockCard({
    id,
    stockCode,
    stockName,
    currentPrice,
    purchasePrice,
    quantity,
    evaluationAmount,
    profit,
    profitRate,
    performanceStatus,
}: StockCardProps) {
    const isProfit = profitRate >= 0;
    const isNeutral = profitRate === 0;

    const TrendIcon = isNeutral ? Minus : isProfit ? TrendingUp : TrendingDown;
    const trendColor = isNeutral
        ? "text-muted-foreground"
        : isProfit
            ? "text-profit"
            : "text-loss";

    return (
        <Card className="w-full hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
                {/* 헤더: 종목명 + 상태 배지 */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">{stockName}</h3>
                        <p className="text-sm text-muted-foreground">{stockCode}</p>
                    </div>
                    <Badge variant="outline" className={cn(statusColors[performanceStatus])}>
                        {statusLabels[performanceStatus]}
                    </Badge>
                </div>

                {/* 현재가 */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">현재가</p>
                    <p className="text-2xl font-bold">{formatKRW(currentPrice)}</p>
                </div>

                {/* 상세 정보 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">매수가</p>
                        <p className="font-medium">{formatKRW(purchasePrice)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">수량</p>
                        <p className="font-medium">{quantity}주</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">평가금액</p>
                        <p className="font-medium">{formatKRW(evaluationAmount)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">수익</p>
                        <div className={cn("flex items-center gap-1", trendColor)}>
                            <TrendIcon className="h-3 w-3" />
                            <span className="font-medium">
                                {formatKRW(profit)} ({isProfit ? "+" : ""}{profitRate.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <Button asChild variant="ghost" className="w-full justify-between">
                    <Link href={`/stocks/${id}`}>
                        상세 분석 보기
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
