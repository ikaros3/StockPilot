"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Target, Zap } from "lucide-react";

interface TradingStrategyTabProps {
    stockId: string;
}

// 임시 데이터
const strategyData = {
    marketPhase: "trend_following" as const,
    marketPhaseDescription: "현재 반도체 업종은 상승 추세에 있으며, 주가는 20일 이동평균선 위에서 안정적으로 움직이고 있습니다.",
    recommendedStrategy: "medium_hold" as const,
    strategyRationale: "단기 변동성보다는 중기적 관점에서 반도체 업황 회복에 베팅하는 전략이 유효합니다. 목표가 도달 시점까지 3-6개월 보유를 권장합니다.",
    portfolioRole: "core_growth" as const,
    roleDescription: "포트폴리오의 핵심 성장 동력으로서, 전체 수익률 견인을 위한 주력 종목으로 활용하세요.",
};

const phaseLabels = {
    trend_following: "추세 추종",
    range_bound: "박스권",
    high_volatility: "변동성 확대",
};

const phaseColors = {
    trend_following: "bg-profit/10 text-profit border-profit/20",
    range_bound: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    high_volatility: "bg-destructive/10 text-destructive border-destructive/20",
};

const strategyLabels = {
    short_swing: "단기 스윙",
    medium_hold: "중기 보유",
    long_term: "장기 투자",
};

const roleLabels = {
    core_growth: "핵심 성장주",
    defensive: "방어주",
    leverage: "레버리지",
};

const roleColors = {
    core_growth: "bg-primary text-primary-foreground",
    defensive: "bg-green-500 text-white",
    leverage: "bg-orange-500 text-white",
};

export function TradingStrategyTab({ stockId }: TradingStrategyTabProps) {
    return (
        <div className="space-y-6">
            {/* 시장 국면 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        현재 시장 국면
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className={`text-lg px-4 py-2 ${phaseColors[strategyData.marketPhase]}`}
                        >
                            {phaseLabels[strategyData.marketPhase]}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{strategyData.marketPhaseDescription}</p>
                </CardContent>
            </Card>

            {/* 권장 전략 */}
            <Card className="border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        권장 전략
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                        {strategyLabels[strategyData.recommendedStrategy]}
                    </Badge>
                    <p>{strategyData.strategyRationale}</p>
                </CardContent>
            </Card>

            {/* 포트폴리오 역할 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        포트폴리오 내 역할
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Badge className={roleColors[strategyData.portfolioRole]}>
                        {roleLabels[strategyData.portfolioRole]}
                    </Badge>
                    <p className="text-muted-foreground">{strategyData.roleDescription}</p>
                </CardContent>
            </Card>
        </div>
    );
}
