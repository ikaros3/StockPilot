"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2, Target, PieChart, RefreshCw } from "lucide-react";
import { useStockData } from "@/hooks/useStockData";

interface SummaryTabProps {
    stockId: string;
}

// 종목코드 매핑 (stockId -> stockCode)
const stockCodeMap: Record<string, string> = {
    "1": "005930", // 삼성전자
    "2": "000660", // SK하이닉스
    "3": "035720", // 카카오
    "4": "005380", // 현대차
};

// 기본 매수 정보 (추후 Firebase에서 로드)
const purchaseInfoMap: Record<string, { purchasePrice: number; targetPrice: number; portfolioWeight: number }> = {
    "005930": { purchasePrice: 65000, targetPrice: 200000, portfolioWeight: 31.2 },
    "000660": { purchasePrice: 120000, targetPrice: 200000, portfolioWeight: 22.5 },
    "035720": { purchasePrice: 48000, targetPrice: 60000, portfolioWeight: 18.3 },
    "005380": { purchasePrice: 200000, targetPrice: 280000, portfolioWeight: 15.0 },
};

export function SummaryTab({ stockId }: SummaryTabProps) {
    const stockCode = stockCodeMap[stockId] || stockId;
    const { price, company, ratios, consensus, isLoading, isError, refresh } = useStockData(stockCode);
    const purchaseInfo = purchaseInfoMap[stockCode] || { purchasePrice: 0, targetPrice: 100000, portfolioWeight: 0 };



    // 에러 상태
    if (isError) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-destructive mb-2">데이터를 불러오는 중 오류가 발생했습니다.</p>
                    <button
                        onClick={() => refresh()}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw className="h-4 w-4" />
                        다시 시도
                    </button>
                </CardContent>
            </Card>
        );
    }

    // 데이터 계산
    const currentPrice = price?.currentPrice;
    const purchasePrice = purchaseInfo.purchasePrice;
    const targetPrice = consensus?.averageTargetPrice || purchaseInfo.targetPrice;

    // 데이터 누락 여부
    const isDataMissing = !isLoading && !currentPrice;

    // 수익률 계산 (데이터 없으면 null)
    const profitRate = (currentPrice && purchasePrice > 0)
        ? ((currentPrice - purchasePrice) / purchasePrice) * 100
        : null;

    // 목표가 진행률 계산
    const targetProgress = (currentPrice && targetPrice > purchasePrice)
        ? Math.min(100, Math.max(0, ((currentPrice - purchasePrice) / (targetPrice - purchasePrice)) * 100))
        : 0;

    // 성과 평가 텍스트 생성
    const generatePerformanceText = () => {
        const stockName = company?.corpName || price?.stockName || `종목 ${stockCode}`;

        if (isDataMissing || profitRate === null) {
            return `${stockName}의 현재 가격 정보를 불러올 수 없습니다.`;
        }

        const profitText = profitRate >= 0
            ? `${profitRate.toFixed(1)}% 상승`
            : `${Math.abs(profitRate).toFixed(1)}% 하락`;

        const consensusText = consensus
            ? `애널리스트 평균 목표가는 ${consensus.averageTargetPrice.toLocaleString()}원으로, 현재가 대비 ${consensus.upside.toFixed(1)}% 상승 여력이 있습니다.`
            : "";

        const buyRecommendation = consensus?.buyCount
            ? `최근 ${consensus.reportCount}개 리포트 중 ${consensus.buyCount}개가 매수 의견입니다.`
            : "";

        return `${stockName}은(는) 현재 매수가 대비 ${profitText}했습니다. ${consensusText} ${buyRecommendation}`;
    };

    // 밸류에이션 데이터
    const valuationMetrics = {
        per: ratios?.per || price?.per || 0,
        pbr: ratios?.pbr || price?.pbr || 0,
        roe: ratios?.roe || 0,
        eps: ratios?.eps || price?.eps || 0,
    };

    return (
        <div className="space-y-6">
            {/* 성과 평가 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className={profitRate && profitRate >= 0 ? "h-5 w-5 text-profit" : "h-5 w-5 text-loss"} />
                        현재 성과 평가
                        <span className="text-xs text-green-500 font-normal">● 실시간</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        {generatePerformanceText()}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <span>현재가: <strong className="text-foreground">{currentPrice ? `₩${currentPrice.toLocaleString()}` : "N/A"}</strong></span>
                        <span className={(profitRate || 0) >= 0 ? "text-profit" : "text-loss"}>
                            {profitRate !== null ? (profitRate >= 0 ? "+" : "") + profitRate.toFixed(2) + "%" : "N/A"}
                        </span>
                    </div>
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
                            매수가: ₩{purchasePrice.toLocaleString()}
                        </span>
                        <span className="font-medium text-profit">
                            목표가: ₩{targetPrice.toLocaleString()}
                        </span>
                    </div>
                    <div className="relative">
                        <Progress value={targetProgress} className="h-4" />
                        {currentPrice && currentPrice > purchasePrice && currentPrice < targetPrice && (
                            <div
                                className="absolute top-0 h-4 w-1 bg-foreground"
                                style={{ left: `${targetProgress}%` }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">진행률</span>
                        <span className={targetProgress > 0 ? "font-bold text-profit" : "font-bold text-loss"}>
                            {targetProgress.toFixed(1)}%
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* 종목 특성 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        기업 정보
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-muted-foreground">회사명</span>
                            <p className="font-medium">{company?.corpName || stockCode}</p>
                        </div>
                        {company?.ceoName && (
                            <div>
                                <span className="text-sm text-muted-foreground">대표이사</span>
                                <p className="font-medium">{company.ceoName}</p>
                            </div>
                        )}
                        {company?.address && (
                            <div>
                                <span className="text-sm text-muted-foreground">주소</span>
                                <p className="font-medium text-sm">{company.address}</p>
                            </div>
                        )}
                        {company?.homepageUrl && (
                            <div>
                                <span className="text-sm text-muted-foreground">홈페이지</span>
                                <p className="font-medium">
                                    <a href={company.homepageUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline">
                                        {company.homepageUrl}
                                    </a>
                                </p>
                            </div>
                        )}
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
                            <p className="text-xl font-bold">{valuationMetrics.per.toFixed(1)}x</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">PBR</span>
                            <p className="text-xl font-bold">{valuationMetrics.pbr.toFixed(2)}x</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">ROE</span>
                            <p className="text-xl font-bold">{valuationMetrics.roe.toFixed(1)}%</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">EPS</span>
                            <p className="text-xl font-bold">₩{Math.round(valuationMetrics.eps).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 컨센서스 */}
            {consensus && (
                <Card>
                    <CardHeader>
                        <CardTitle>애널리스트 컨센서스</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <span className="text-sm text-muted-foreground">평균 목표가</span>
                                <p className="text-lg font-bold">₩{consensus.averageTargetPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <span className="text-sm text-muted-foreground">상승 여력</span>
                                <p className={`text-lg font-bold ${consensus.upside >= 0 ? "text-profit" : "text-loss"}`}>
                                    {consensus.upside >= 0 ? "+" : ""}{consensus.upside.toFixed(1)}%
                                </p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <span className="text-sm text-muted-foreground">리포트 수</span>
                                <p className="text-lg font-bold">{consensus.reportCount}건</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <span className="text-sm text-muted-foreground">투자의견</span>
                                <p className="text-lg font-bold text-profit">
                                    매수 {consensus.buyCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            <Progress value={purchaseInfo.portfolioWeight} className="h-3" />
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold">
                            {purchaseInfo.portfolioWeight}%
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
