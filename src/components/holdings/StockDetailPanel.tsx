"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, X, ExternalLink } from "lucide-react";
import { StockChart } from "../charts/StockChart";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStockPrice, useDailyPrices, useInvestorTrends } from "@/hooks/useStockData";
import { useState } from "react";

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
    const [period, setPeriod] = useState("D");
    const { price, isLoading: priceLoading } = useStockPrice(stockCode);
    const { dailyPrices, isLoading: dailyLoading } = useDailyPrices(stockCode, period);
    const { investors, isLoading: investorLoading } = useInvestorTrends(stockCode);

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
            <CardContent className="pt-3">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 시세 정보 (좁게) */}
                    <div className="p-3 flex flex-col border-r border-primary/10 lg:col-span-1 order-2 lg:order-1 bg-card/10">
                        {/* 상단: 종목명, 코드, 버튼 */}
                        <div className="flex flex-row lg:flex-col justify-between items-start gap-1 mb-2.5">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xl font-bold truncate">{stockName}</CardTitle>
                                    {isDataMissing && (
                                        <Badge variant="secondary" className="text-xs h-5">데이터 없음</Badge>
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground font-mono">{stockCode}</span>
                            </div>
                        </div>

                        {/* 중단: 시세 데이터 (그리드 활용) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-2.5">
                            {/* 현재가 */}
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">현재가</p>
                                <div className="flex items-baseline gap-1.5">
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-24" />
                                    ) : (
                                        <>
                                            <span className={cn("text-2xl font-bold tracking-tight", isDataMissing && "text-muted-foreground")}>
                                                {currentPrice ? formatNumber(currentPrice) : "N/A"}
                                            </span>
                                            {!isDataMissing && (
                                                <div className={cn(
                                                    "flex items-center gap-0.5 text-xs font-bold",
                                                    isProfit ? "text-red-500" : "text-blue-500"
                                                )}>
                                                    <span>{isProfit ? "▲" : "▼"}</span>
                                                    <span>{changeRate.toFixed(2)}%</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 전일대비 */}
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">전일대비</p>
                                {isLoading ? (
                                    <Skeleton className="h-5 w-20" />
                                ) : (
                                    <p className={cn(
                                        "font-bold text-base",
                                        isDataMissing ? "text-muted-foreground" : (isProfit ? "text-red-500" : "text-blue-500")
                                    )}>
                                        {isDataMissing ? "-" : (isProfit ? "+" : "") + formatNumber(changePrice)}
                                    </p>
                                )}
                            </div>

                            {/* 거래량 */}
                            <div>
                                <p className="text-base text-muted-foreground mb-1">거래량</p>
                                {isLoading ? (
                                    <Skeleton className="h-5 w-20" />
                                ) : (
                                    <p className="font-bold text-base">
                                        {isDataMissing ? "-" : formatNumber(volume)}
                                    </p>
                                )}
                            </div>

                            {/* 고가 / 저가 (함께 묶음) */}
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-base text-muted-foreground mb-1">고가</p>
                                    <p className={cn("font-bold text-base", !isDataMissing && "text-red-500")}>
                                        {isDataMissing ? "-" : formatNumber(high)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-base text-muted-foreground mb-1">저가</p>
                                    <p className={cn("font-bold text-base", !isDataMissing && "text-blue-500")}>
                                        {isDataMissing ? "-" : formatNumber(low)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 하단: 투자자 동향 (그리드 활용) */}
                        <div className="mt-4 pt-3 border-t border-primary/10">
                            <div className="flex items-center mb-3">
                                <p className="text-sm font-bold flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 text-primary/60" />
                                    투자자 동향
                                    {investors?.date && (
                                        <span className="text-muted-foreground font-normal ml-1">
                                            ({investors.date.slice(4, 6)}.{investors.date.slice(6, 8)})
                                        </span>
                                    )}
                                </p>
                            </div>

                            {investorLoading ? (
                                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : investors ? (
                                <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                                    {[
                                        { label: "개인", value: investors.private },
                                        { label: "외국인", value: investors.foreign },
                                        { label: "기관", value: investors.institutional }
                                    ].map((item) => {
                                        const val = item.value ?? 0;
                                        const absVal = Math.abs(val);
                                        const formatted = absVal >= 10000
                                            ? `${Math.round(val / 10000).toLocaleString()}만`
                                            : `${val.toLocaleString()}`;
                                        const displayWithSign = val > 0 ? `+${formatted}` : formatted;

                                        return (
                                            <div key={item.label} className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center bg-muted/10 p-2.5 lg:p-0 rounded-md gap-1">
                                                <span className="text-muted-foreground text-sm font-medium">{item.label}</span>
                                                <span className={cn(
                                                    "font-bold text-base sm:text-lg",
                                                    val > 0 ? "text-red-500" : val < 0 ? "text-blue-500" : ""
                                                )}>
                                                    {displayWithSign}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground text-center py-2">데이터 없음</p>
                            )}
                        </div>
                    </div>

                    {/* 차트 영역 (오른쪽 - 넓게) */}
                    <div className="lg:col-span-3 order-1 lg:order-2 bg-background/10">
                        {dailyLoading ? (
                            <Skeleton className="h-[400px] w-full" />
                        ) : dailyPrices && dailyPrices.length > 0 ? (
                            <StockChart
                                stockCode={stockCode}
                                data={dailyPrices}
                                height={400}
                                purchasePrice={purchasePrice}
                                period={period}
                                onPeriodChange={setPeriod}
                            />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center">
                                <p className="text-muted-foreground text-sm">차트 데이터 없음</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
