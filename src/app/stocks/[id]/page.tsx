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

// import { SummaryTab } from "@/components/analysis/SummaryTab"; // 이미 있음

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
    const currentPrice = price?.currentPrice || 0;
    const previousClose = (price?.currentPrice || 0) - (price?.changePrice || 0); // 전일종가 유추
    const changePrice = price?.changePrice || 0;
    const changeRate = price?.changeRate || 0;
    const isProfit = changeRate >= 0;

    // 로딩 중일 때
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-start justify-between">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

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
                                <h1 className="text-2xl font-bold">{company?.corpName || price?.stockName || "종목명 로딩 실패"}</h1>
                                <Badge variant="outline">{stockCode}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl font-bold">
                                    ₩{currentPrice.toLocaleString()}
                                </span>
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
                                        {isProfit ? "+" : ""}{changeRate.toFixed(2)}%
                                    </span>
                                </div>
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
