"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, X, ExternalLink } from "lucide-react";
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

    // 간단한 미니 차트 표시 (최근 10일 데이터)
    const chartData = dailyPrices?.slice(0, 10).reverse() || [];

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
                    <div className="lg:col-span-2">
                        <p className="text-sm text-muted-foreground mb-2">최근 10일 추이</p>
                        {dailyLoading ? (
                            <Skeleton className="h-32" />
                        ) : chartData.length > 0 ? (
                            <div className="h-32 flex items-end gap-1 bg-muted/20 rounded-lg p-4">
                                {chartData.map((day: { date: string; close: number }, index: number) => {
                                    const maxPrice = Math.max(...chartData.map((d: { close: number }) => d.close));
                                    const minPrice = Math.min(...chartData.map((d: { close: number }) => d.close));
                                    const range = maxPrice - minPrice || 1;
                                    const height = ((day.close - minPrice) / range) * 100;
                                    const isUp = index > 0 && day.close >= chartData[index - 1].close;

                                    return (
                                        <div
                                            key={day.date}
                                            className="flex-1 flex flex-col items-center gap-1"
                                        >
                                            <div
                                                className={cn(
                                                    "w-full rounded-sm transition-all",
                                                    isUp ? "bg-profit/80" : "bg-loss/80"
                                                )}
                                                style={{ height: `${Math.max(height, 10)}%` }}
                                                title={`${day.date}: ${formatCurrency(day.close)}`}
                                            />
                                            <span className="text-[10px] text-muted-foreground">
                                                {day.date.slice(-2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center bg-muted/20 rounded-lg">
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
                                    isProfit ? "text-profit" : "text-loss"
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
                                    isProfit ? "text-profit" : "text-loss"
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
                                <p className="font-medium text-profit">{formatCurrency(high)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">저가</p>
                                <p className="font-medium text-loss">{formatCurrency(low)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
