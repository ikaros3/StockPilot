"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useStockData } from "@/hooks/useStockData";

interface ExitTimingTabProps {
    stockId: string;
}

// 종목코드 매핑
const stockCodeMap: Record<string, string> = {
    "1": "005930",
    "2": "000660",
    "3": "035720",
    "4": "005380",
};

// 매수 정보 (추후 Firebase에서 로드)
const purchaseInfoMap: Record<string, { purchasePrice: number; quantity: number }> = {
    "005930": { purchasePrice: 65000, quantity: 100 },
    "000660": { purchasePrice: 120000, quantity: 50 },
    "035720": { purchasePrice: 48000, quantity: 50 },
    "005380": { purchasePrice: 200000, quantity: 20 },
};

// 매도 전략 계산 함수
function calculateExitStrategy(
    currentPrice: number,
    purchasePrice: number,
    quantity: number,
    targetPrice: number
) {
    const investmentAmount = purchasePrice * quantity;
    const currentValue = currentPrice * quantity;
    const profitRate = ((currentPrice - purchasePrice) / purchasePrice) * 100;

    // 1차 목표가: 현재가에서 +15% 또는 컨센서스 목표가의 50%
    const firstTargetGap = (targetPrice - currentPrice) / 2;
    const firstTargetPrice = Math.round(currentPrice + firstTargetGap);
    const firstSellRatio = 50;
    const firstExpectedProfit = Math.round((firstTargetPrice - purchasePrice) * quantity * (firstSellRatio / 100));

    // 2차 목표가: 컨센서스 목표가
    const secondTargetPrice = targetPrice;
    const secondSellRatio = 100;
    const secondExpectedProfit = Math.round(
        (firstTargetPrice - purchasePrice) * quantity * (firstSellRatio / 100) +
        (secondTargetPrice - purchasePrice) * quantity * ((100 - firstSellRatio) / 100)
    );

    // 위험 요인 분석
    const riskFactors: string[] = [];
    if (profitRate > 50) riskFactors.push("고점 매도 타이밍 주의");
    if (profitRate < 0) riskFactors.push("손실 구간 - 반등 신호 확인 필요");
    riskFactors.push("시장 변동성에 따른 목표가 조정 가능");

    return {
        firstExit: {
            targetPrice: firstTargetPrice,
            sellRatio: firstSellRatio,
            expectedProfit: firstExpectedProfit > 0 ? firstExpectedProfit : 0,
            rationale: firstTargetPrice > currentPrice
                ? `현재가 대비 ${((firstTargetPrice - currentPrice) / currentPrice * 100).toFixed(1)}% 상승 시점입니다. 수익 일부를 확정하고 리스크를 분산하세요.`
                : "목표가에 가까워지면 일부 물량 정리를 고려하세요.",
            timing: profitRate > 20 ? "매도 시점 고려 필요" : "향후 1-3개월 내",
            riskFactors,
        },
        secondExit: {
            targetPrice: secondTargetPrice,
            sellRatio: secondSellRatio - firstSellRatio,
            expectedProfit: secondExpectedProfit > 0 ? secondExpectedProfit : 0,
            rationale: `애널리스트 컨센서스 목표가 ${secondTargetPrice.toLocaleString()}원 달성 시 잔여 물량을 전량 매도하세요.`,
            timing: "향후 6개월-1년",
            holdingPeriod: "장기",
        },
        recommendation: profitRate > 30
            ? "이미 상당한 수익을 실현 중입니다. 단계적 익절을 통해 수익을 확정하세요."
            : profitRate > 0
                ? "단계적 익절 전략을 권장합니다. 1차 목표가에서 50%를 매도하여 수익을 확정하고, 잔여 물량은 2차 목표가까지 보유하세요."
                : "현재 손실 구간입니다. 손절 라인을 설정하고 반등 신호를 주시하세요.",
        currentProfitRate: profitRate,
    };
}

export function ExitTimingTab({ stockId }: ExitTimingTabProps) {
    const stockCode = stockCodeMap[stockId] || stockId;
    const { price, consensus, isLoading, isError } = useStockData(stockCode);
    const purchaseInfo = purchaseInfoMap[stockCode] || { purchasePrice: 0, quantity: 0 };

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card className="border-l-4 border-l-profit">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-16" />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 데이터가 없을 경우 기본값 사용
    const currentPrice = price?.currentPrice || purchaseInfo.purchasePrice || 78000;
    const targetPrice = consensus?.averageTargetPrice || currentPrice * 1.2;

    const exitData = calculateExitStrategy(
        currentPrice,
        purchaseInfo.purchasePrice || currentPrice * 0.9,
        purchaseInfo.quantity || 100,
        targetPrice
    );

    return (
        <div className="space-y-6">
            {/* 현재 상태 표시 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm">
                        <span>현재가: <strong>₩{currentPrice.toLocaleString()}</strong></span>
                        <span>목표가: <strong>₩{targetPrice.toLocaleString()}</strong></span>
                        <span className={exitData.currentProfitRate >= 0 ? "text-profit" : "text-loss"}>
                            수익률: <strong>{exitData.currentProfitRate >= 0 ? "+" : ""}{exitData.currentProfitRate.toFixed(1)}%</strong>
                        </span>
                        <span className="text-xs text-green-500">● 실시간</span>
                    </div>
                </CardContent>
            </Card>

            {/* 1차 익절 전략 */}
            <Card className="border-l-4 border-l-profit">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-profit" />
                            1차 익절 전략
                        </CardTitle>
                        <Badge className="bg-profit text-profit-foreground">
                            목표가 ₩{exitData.firstExit.targetPrice.toLocaleString()}
                        </Badge>
                    </div>
                    <CardDescription>단기 수익 확정 전략</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">매도 비율</span>
                            <p className="text-xl font-bold">{exitData.firstExit.sellRatio}%</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">예상 수익</span>
                            <p className={`text-xl font-bold ${exitData.firstExit.expectedProfit >= 0 ? "text-profit" : "text-loss"}`}>
                                {exitData.firstExit.expectedProfit >= 0 ? "+" : ""}₩{exitData.firstExit.expectedProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div>
                        <span className="text-sm text-muted-foreground">매도 근거</span>
                        <p className="mt-1">{exitData.firstExit.rationale}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">권장 시점: {exitData.firstExit.timing}</span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">리스크 요인</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {exitData.firstExit.riskFactors.map((risk, i) => (
                                <li key={i}>{risk}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* 2차 익절 전략 */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            2차 익절 전략
                        </CardTitle>
                        <Badge variant="secondary">
                            최종 목표 ₩{exitData.secondExit.targetPrice.toLocaleString()}
                        </Badge>
                    </div>
                    <CardDescription>장기 수익 극대화 전략</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">매도 비율</span>
                            <p className="text-xl font-bold">잔여 {exitData.secondExit.sellRatio}%</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">예상 총 수익</span>
                            <p className={`text-xl font-bold ${exitData.secondExit.expectedProfit >= 0 ? "text-profit" : "text-loss"}`}>
                                {exitData.secondExit.expectedProfit >= 0 ? "+" : ""}₩{exitData.secondExit.expectedProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div>
                        <span className="text-sm text-muted-foreground">전략 설명</span>
                        <p className="mt-1">{exitData.secondExit.rationale}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">예상 보유 기간: {exitData.secondExit.timing}</span>
                    </div>
                </CardContent>
            </Card>

            {/* 종합 추천 */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">전략 추천</h4>
                            <p className="text-muted-foreground">{exitData.recommendation}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
