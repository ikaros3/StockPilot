"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// 분석 탭 컴포넌트
import { SummaryTab } from "@/components/analysis/SummaryTab";
import { ExitTimingTab } from "@/components/analysis/ExitTimingTab";
import { AccumulationTab } from "@/components/analysis/AccumulationTab";
import { RiskControlTab } from "@/components/analysis/RiskControlTab";
import { TradingStrategyTab } from "@/components/analysis/TradingStrategyTab";
import { HoldingPeriodTab } from "@/components/analysis/HoldingPeriodTab";
import { AnalystTab } from "@/components/analysis/AnalystTab";

import { useStockData } from "@/hooks/useStockData";

// ... existing imports ...

interface StockDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
    const { id } = use(params);

    // 종목코드 매핑 (임시: 나중에 DB나 API에서 가져와야 함)
    const stockCodeMap: Record<string, string> = {
        "1": "005930", // 삼성전자
        "2": "000660", // SK하이닉스
        "3": "035720", // 카카오
        "4": "005380", // 현대차
    };
    const stockCode = stockCodeMap[id] || id;

    const { price, company, isLoading } = useStockData(stockCode);

    // 가격 정보
    const currentPrice = price?.currentPrice;
    const changePrice = price?.changePrice;
    const changeRate = price?.changeRate;
    const isProfit = (changeRate || 0) >= 0;

    // 데이터가 없는 경우 (로딩 끝났는데 price가 없는 경우)
    const isDataMissing = !isLoading && !currentPrice;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">
                                    {isLoading ? (
                                        <Skeleton className="h-8 w-48 inline-block align-middle" />
                                    ) : (
                                        company?.corpName || price?.stockName || stockCode
                                    )}
                                </h1>
                                <Badge variant="outline">{stockCode}</Badge>
                                {isDataMissing && (
                                    <Badge variant="secondary" className="ml-2">데이터 없음</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {isLoading ? (
                                    <Skeleton className="h-8 w-32" />
                                ) : (
                                    <>
                                        <span className={cn("text-2xl font-bold", isDataMissing && "text-muted-foreground")}>
                                            {currentPrice ? `₩${currentPrice.toLocaleString()}` : "N/A"}
                                        </span>
                                        {!isDataMissing && (
                                            <div className={cn(
                                                "flex items-center gap-1",
                                                isProfit ? "text-profit" : "text-loss"
                                            )}>
                                                {isProfit ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                <span className="font-medium">
                                                    {isProfit ? "+" : ""}{changeRate?.toFixed(2)}%
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 분석 탭 */}
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="summary">요약</TabsTrigger>
                        <TabsTrigger value="exit-timing">매도 타이밍</TabsTrigger>
                        <TabsTrigger value="accumulation">추가 매수</TabsTrigger>
                        <TabsTrigger value="risk-control">익절/손절</TabsTrigger>
                        <TabsTrigger value="trading-strategy">매매 전략</TabsTrigger>
                        <TabsTrigger value="holding-period">보유 기간</TabsTrigger>
                        <TabsTrigger value="analyst">애널리스트</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-6">
                        <SummaryTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="exit-timing" className="mt-6">
                        <ExitTimingTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="accumulation" className="mt-6">
                        <AccumulationTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="risk-control" className="mt-6">
                        <RiskControlTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="trading-strategy" className="mt-6">
                        <TradingStrategyTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="holding-period" className="mt-6">
                        <HoldingPeriodTab stockId={id} />
                    </TabsContent>

                    <TabsContent value="analyst" className="mt-6">
                        <AnalystTab stockId={id} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
