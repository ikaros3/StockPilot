"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Building, Globe } from "lucide-react";

interface HoldingPeriodTabProps {
    stockId: string;
}

// 임시 데이터
const holdingData = {
    recommendedHorizon: "medium" as const,
    estimatedPeriod: "3-6개월",
    rationale: {
        industryCycle: "반도체 업황은 현재 회복 초기 단계에 있으며, 본격적인 상승기 진입까지 2-3분기 소요 예상",
        earningsCycle: "2026년 하반기부터 실적 턴어라운드 예상. 메모리 가격 반등과 함께 영업이익률 개선 전망",
        macroEnvironment: "연준 금리 인하 기대감으로 성장주 밸류에이션 확장 가능성. 다만 지정학적 리스크는 상존",
    },
};

const horizonLabels = {
    short: "단기 (1개월 이내)",
    medium: "중기 (3-6개월)",
    long: "장기 (1년 이상)",
};

const horizonColors = {
    short: "bg-yellow-500 text-white",
    medium: "bg-primary text-primary-foreground",
    long: "bg-green-600 text-white",
};

export function HoldingPeriodTab({ stockId }: HoldingPeriodTabProps) {
    return (
        <div className="space-y-6">
            {/* 권장 보유 기간 */}
            <Card className="border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        권장 보유 기간
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Badge className={`text-lg px-6 py-3 ${horizonColors[holdingData.recommendedHorizon]}`}>
                            {holdingData.estimatedPeriod}
                        </Badge>
                        <span className="text-muted-foreground">
                            {horizonLabels[holdingData.recommendedHorizon]}
                        </span>
                    </div>

                    {/* 타임라인 시각화 */}
                    <div className="mt-6">
                        <div className="relative pt-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">현재</span>
                                <span className="text-xs text-muted-foreground">3개월</span>
                                <span className="text-xs font-bold text-primary">6개월</span>
                                <span className="text-xs text-muted-foreground">1년</span>
                            </div>
                            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                <div className="w-1/4 bg-muted-foreground/30" />
                                <div className="w-1/4 bg-primary" />
                                <div className="w-1/4 bg-primary/50" />
                                <div className="w-1/4 bg-muted" />
                            </div>
                            <div className="absolute top-6 left-1/4 transform -translate-x-1/2">
                                <span className="text-xs">▲</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 보유 기간 근거 */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 산업 사이클 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            산업 사이클
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {holdingData.rationale.industryCycle}
                        </p>
                    </CardContent>
                </Card>

                {/* 실적 사이클 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building className="h-4 w-4" />
                            실적 사이클
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {holdingData.rationale.earningsCycle}
                        </p>
                    </CardContent>
                </Card>

                {/* 거시 환경 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="h-4 w-4" />
                            거시 환경
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {holdingData.rationale.macroEnvironment}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
