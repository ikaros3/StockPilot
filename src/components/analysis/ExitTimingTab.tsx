"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface ExitTimingTabProps {
    stockId: string;
}

// 임시 데이터
const exitData = {
    firstExit: {
        targetPrice: 85000,
        sellRatio: 50,
        expectedProfit: 1000000,
        rationale: "기술적으로 85,000원 구간은 강력한 저항선입니다. 1차 목표가 도달 시 50% 물량 정리로 수익 확정을 권장합니다.",
        timing: "향후 1-2개월 내",
        riskFactors: ["글로벌 반도체 수요 둔화 가능성", "미중 무역 분쟁 재발"],
    },
    secondExit: {
        targetPrice: 95000,
        sellRatio: 100,
        expectedProfit: 1500000,
        rationale: "반도체 슈퍼사이클 진입 시 95,000원까지 추가 상승 여력이 있습니다. 잔여 물량은 장기 보유 후 전량 매도를 고려하세요.",
        timing: "향후 6개월-1년",
        holdingPeriod: "장기",
    },
    recommendation: "단계적 익절 전략을 권장합니다. 1차 목표가에서 50%를 매도하여 수익을 확정하고, 잔여 물량은 2차 목표가까지 보유하세요.",
};

export function ExitTimingTab({ stockId }: ExitTimingTabProps) {
    return (
        <div className="space-y-6">
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
                            <p className="text-xl font-bold text-profit">
                                +₩{exitData.firstExit.expectedProfit.toLocaleString()}
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
                            <p className="text-xl font-bold">잔여 {100 - exitData.firstExit.sellRatio}%</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">예상 총 수익</span>
                            <p className="text-xl font-bold text-profit">
                                +₩{exitData.secondExit.expectedProfit.toLocaleString()}
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
                            <h4 className="font-semibold mb-1">단계적 익절 추천</h4>
                            <p className="text-muted-foreground">{exitData.recommendation}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
