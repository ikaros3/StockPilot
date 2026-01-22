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
    purchasePrice?: number;
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

export function StockDetailPanel({ stockCode, stockName, purchasePrice, onClose }: StockDetailPanelProps) {
    const { price, isLoading: priceLoading } = useStockPrice(stockCode);
    const { dailyPrices, isLoading: dailyLoading } = useDailyPrices(stockCode);

    const isLoading = priceLoading;
    const currentPrice = price?.currentPrice;
    const changePrice = price?.changePrice || 0;
    const changeRate = price?.changeRate || 0;
    const isProfit = changeRate >= 0;
    const volume = price?.volume || 0;
    const high = price?.highPrice || 0;
    const low = price?.lowPrice || 0;

    // 데이터가 없는 경우 (로딩 끝났는데 price가 없는 경우)
    const isDataMissing = !isLoading && !currentPrice;

    return (
        <Card className="mt-4 border-primary/20 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{stockName}</CardTitle>
                    <Badge variant="outline">{stockCode}</Badge>
                    {isDataMissing && (
                        <Badge variant="secondary" className="ml-2">데이터 없음</Badge>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 시세 정보 (왼쪽 - 좁게) */}
                    <div className="space-y-3 lg:col-span-1 order-2 lg:order-1 flex flex-col pb-4">

                        {/* 상세 분석 버튼 위치 이동 */}
                        <div>
                            <Link href={`/stocks/${stockCode}`}>
                                <Button variant="outline" size="sm" className="w-full gap-2 h-8 text-xs">
                                    <ExternalLink className="h-3 w-3" />
                                    상세 분석
                                </Button>
                            </Link>
                        </div>

                        {/* 정보 표시 영역 (세로 스택) */}
                        <div className="space-y-2">
                            {/* 현재가 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">현재가</p>
                                <div className="flex items-center gap-2">
                                    {isLoading ? (
                                        <Skeleton className="h-8 w-32" />
                                    ) : (
                                        <>
                                            <span className={cn("text-xl font-bold", isDataMissing && "text-muted-foreground")}>
                                                {currentPrice ? formatCurrency(currentPrice) : "N/A"}
                                            </span>
                                            {!isDataMissing && (
                                                <div className={cn(
                                                    "flex items-center gap-1",
                                                    isProfit ? "text-red-500" : "text-blue-500"
                                                )}>
                                                    {isProfit ? (
                                                        <TrendingUp className="h-3 w-3" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3" />
                                                    )}
                                                    <span className="text-xs font-medium">
                                                        {isProfit ? "+" : ""}{changeRate.toFixed(2)}%
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 전일대비 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">전일대비</p>
                                {isLoading ? (
                                    <Skeleton className="h-6 w-24" />
                                ) : (
                                    <p className={cn(
                                        "font-medium text-base",
                                        isDataMissing ? "text-muted-foreground" : (isProfit ? "text-red-500" : "text-blue-500")
                                    )}>
                                        {isDataMissing ? "-" : (isProfit ? "+" : "") + formatCurrency(changePrice)}
                                    </p>
                                )}
                            </div>

                            {/* 거래량 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">거래량</p>
                                {isLoading ? (
                                    <Skeleton className="h-6 w-24" />
                                ) : (
                                    <p className="font-medium text-base">
                                        {isDataMissing ? "-" : formatNumber(volume) + "주"}
                                    </p>
                                )}
                            </div>

                            {/* 고가 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">고가</p>
                                {isLoading ? (
                                    <Skeleton className="h-6 w-24" />
                                ) : (
                                    <p className={cn("font-medium text-base", !isDataMissing && "text-red-500")}>
                                        {isDataMissing ? "-" : formatCurrency(high)}
                                    </p>
                                )}
                            </div>

                            {/* 저가 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">저가</p>
                                {isLoading ? (
                                    <Skeleton className="h-6 w-24" />
                                ) : (
                                    <p className={cn("font-medium text-base", !isDataMissing && "text-blue-500")}>
                                        {isDataMissing ? "-" : formatCurrency(low)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 차트 영역 (오른쪽 - 넓게) */}
                    <div className="lg:col-span-3 min-h-[400px] order-1 lg:order-2">
                        {dailyLoading ? (
                            <Skeleton className="h-[400px] w-full" />
                        ) : dailyPrices && dailyPrices.length > 0 ? (
                            <StockChart data={dailyPrices} height={400} purchasePrice={purchasePrice} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
                                <p className="text-muted-foreground text-sm">차트 데이터 없음</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
