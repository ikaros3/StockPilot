"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, X, ExternalLink } from "lucide-react";
import { StockChart } from "../charts/StockChart";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStockPrice, useDailyPrices } from "@/hooks/useStockData";

interface StockDetailPanelProps {
    stockCode: string;
    stockName: string;
    onClose: () => void;
}

/**
 * 숫자를 천단위 콤마 포맷으로 변환
 */
function formatNumber(num: number): string {
    return num.toLocaleString("ko-KR");
}

/**
 * 금액을 원화 포맷으로 변환
 */
function formatCurrency(num: number): string {
    return `${formatNumber(Math.round(num))}원`;
}

export function StockDetailPanel({ stockCode, stockName, onClose }: StockDetailPanelProps) {
    const { price, isLoading: priceLoading } = useStockPrice(stockCode);
    const { dailyPrices, isLoading: dailyLoading } = useDailyPrices(stockCode);

    const isLoading = priceLoading;
    const currentPrice = price?.currentPrice || 0;
    const changePrice = price?.changePrice || 0;
    const changeRate = price?.changeRate || 0;
    const isProfit = changeRate >= 0;
    const volume = price?.volume || 0;
    const high = price?.highPrice || 0;
    const low = price?.lowPrice || 0;

    if (isLoading) {
        return (
            <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-8 w-8" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-40" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4 border-primary/20 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{stockName}</CardTitle>
                    <Badge variant="outline">{stockCode}</Badge>
                    <Link href={`/stocks/${stockCode}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            상세 분석
                        </Button>
                    </Link>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 미니 차트 영역 */}
                    {/* 차트 영역 */}
                    <div className="lg:col-span-2 min-h-[400px]">
                        {dailyLoading ? (
                            <Skeleton className="h-[400px] w-full" />
                        ) : dailyPrices && dailyPrices.length > 0 ? (
                            <StockChart data={dailyPrices} height={400} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
                                <p className="text-muted-foreground text-sm">차트 데이터 없음</p>
                            </div>
                        )}
                    </div>

                    {/* 시세 정보 */}
                    <div className="space-y-4">
                        {/* 현재가 */}
                        <div>
                            <p className="text-sm text-muted-foreground">현재가</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">{formatCurrency(currentPrice)}</span>
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isProfit ? "text-red-500" : "text-blue-500"
                                )}>
                                    {isProfit ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {isProfit ? "+" : ""}{changeRate.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 전일대비 / 거래량 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">전일대비</p>
                                <p className={cn(
                                    "font-medium",
                                    isProfit ? "text-red-500" : "text-blue-500"
                                )}>
                                    {isProfit ? "+" : ""}{formatCurrency(changePrice)}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">거래량</p>
                                <p className="font-medium">{formatNumber(volume)}주</p>
                            </div>
                        </div>

                        {/* 고가/저가 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">고가</p>
                                <p className="font-medium text-red-500">{formatCurrency(high)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">저가</p>
                                <p className="font-medium text-blue-500">{formatCurrency(low)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
