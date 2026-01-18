"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskControlTabProps {
    stockId: string;
}

// 임시 데이터
const riskData = {
    stopLoss: {
        priceBasedStopLoss: 58500,  // 매수가 대비 -10%
        portfolioBasedStopLoss: 55250,  // 포트폴리오 손실 한도 -15%
    },
    riskFactors: [
        { category: "시장 리스크", description: "글로벌 경기 침체 가능성", severity: "medium" as const },
        { category: "산업 리스크", description: "반도체 수요 둔화 우려", severity: "high" as const },
        { category: "기업 리스크", description: "파운드리 경쟁 심화", severity: "low" as const },
        { category: "환율 리스크", description: "원/달러 환율 상승", severity: "medium" as const },
    ],
    defenseStrategies: [
        { type: "partial_sell" as const, description: "부분 매도", recommendation: "손실 -5% 도달 시 30% 물량 정리" },
        { type: "reduce_position" as const, description: "비중 축소", recommendation: "포트폴리오 비중 20% 이하로 조정" },
        { type: "hedge" as const, description: "헤지 전략", recommendation: "인버스 ETF 10% 편입 고려" },
    ],
};

const severityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
};

const severityLabels = {
    high: "높음",
    medium: "중간",
    low: "낮음",
};

export function RiskControlTab({ stockId }: RiskControlTabProps) {
    return (
        <div className="space-y-6">
            {/* 손절선 */}
            <Card className="border-l-4 border-l-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        손절선 설정
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">가격 기준 손절선</span>
                            <p className="text-2xl font-bold text-loss">
                                ₩{riskData.stopLoss.priceBasedStopLoss.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">매수가 대비 -10%</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">포트폴리오 손실 한도</span>
                            <p className="text-2xl font-bold text-loss">
                                ₩{riskData.stopLoss.portfolioBasedStopLoss.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">총 손실률 -15% 기준</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 주요 리스크 요인 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        주요 리스크 요인
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {riskData.riskFactors.map((risk, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border",
                                    severityColors[risk.severity]
                                )}
                            >
                                <div>
                                    <p className="font-medium">{risk.category}</p>
                                    <p className="text-sm opacity-80">{risk.description}</p>
                                </div>
                                <Badge variant="outline" className={severityColors[risk.severity]}>
                                    위험도: {severityLabels[risk.severity]}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 방어 전략 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        방어 전략
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {riskData.defenseStrategies.map((strategy, i) => (
                            <div key={i} className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary">{strategy.description}</Badge>
                                </div>
                                <p className="text-sm">{strategy.recommendation}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
