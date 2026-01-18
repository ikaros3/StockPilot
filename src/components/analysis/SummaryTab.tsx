"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Building2, Target, PieChart } from "lucide-react";

interface SummaryTabProps {
    stockId: string;
}

// 임시 데이터
const summaryData = {
    performanceText: "삼성전자는 현재 매수가 대비 20% 상승하여 목표 수익률의 67%를 달성했습니다. 반도체 업황 개선과 함께 추가 상승 여력이 있습니다.",
    targetProgress: 67,
    targetPrice: 90000,
    currentPrice: 78000,
    purchasePrice: 65000,
    stockCharacteristics: {
        businessStructure: "메모리 반도체 1위, 파운드리 2위",
        industryPosition: "글로벌 반도체 시장 리더",
        dividendPolicy: "연 4% 배당 수익률, 분기 배당",
    },
    valuationMetrics: {
        per: 12.5,
        pbr: 1.2,
        roe: 15.3,
        eps: 6240,
    },
    portfolioWeight: 31.2,
};

export function SummaryTab({ stockId }: SummaryTabProps) {
    return (
        <div className="space-y-6">
            {/* 성과 평가 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-profit" />
                        현재 성과 평가
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        {summaryData.performanceText}
                    </p>
                </CardContent>
            </Card>

            {/* 목표가 진행률 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        목표가 대비 진행률
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            매수가: ₩{summaryData.purchasePrice.toLocaleString()}
                        </span>
                        <span className="font-medium text-profit">
                            목표가: ₩{summaryData.targetPrice.toLocaleString()}
                        </span>
                    </div>
                    <div className="relative">
                        <Progress value={summaryData.targetProgress} className="h-4" />
                        <div
                            className="absolute top-0 h-4 w-1 bg-foreground"
                            style={{ left: `${(summaryData.currentPrice - summaryData.purchasePrice) / (summaryData.targetPrice - summaryData.purchasePrice) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">진행률</span>
                        <span className="font-bold text-profit">{summaryData.targetProgress}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* 종목 특성 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        종목 특성
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-muted-foreground">사업 구조</span>
                            <p className="font-medium">{summaryData.stockCharacteristics.businessStructure}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">산업 포지션</span>
                            <p className="font-medium">{summaryData.stockCharacteristics.industryPosition}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">배당 성향</span>
                            <p className="font-medium">{summaryData.stockCharacteristics.dividendPolicy}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 밸류에이션 */}
            <Card>
                <CardHeader>
                    <CardTitle>밸류에이션</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">PER</span>
                            <p className="text-xl font-bold">{summaryData.valuationMetrics.per}x</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">PBR</span>
                            <p className="text-xl font-bold">{summaryData.valuationMetrics.pbr}x</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">ROE</span>
                            <p className="text-xl font-bold">{summaryData.valuationMetrics.roe}%</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">EPS</span>
                            <p className="text-xl font-bold">₩{summaryData.valuationMetrics.eps.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 포트폴리오 비중 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        포트폴리오 내 비중
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Progress value={summaryData.portfolioWeight} className="h-3" />
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold">
                            {summaryData.portfolioWeight}%
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
