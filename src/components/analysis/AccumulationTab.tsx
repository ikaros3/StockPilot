"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";

interface AccumulationTabProps {
    stockId: string;
}

// 임시 데이터
const accumulationData = {
    zone: {
        minPrice: 72000,
        maxPrice: 75000,
        supportLevel: 70000,
        valuationBasis: "PER 10x 수준으로 역사적 저평가 구간",
    },
    recommendedRatio: 20,
    buyConditions: [
        { condition: "지지선 근접", trigger: "72,000원 이하 하락 시", met: false },
        { condition: "거래량 증가", trigger: "20일 평균 거래량 2배 이상", met: true },
        { condition: "기술적 과매도", trigger: "RSI 30 이하", met: false },
        { condition: "실적 서프라이즈", trigger: "컨센서스 10% 상회", met: true },
    ],
};

export function AccumulationTab({ stockId }: AccumulationTabProps) {
    return (
        <div className="space-y-6">
            {/* 추가 매수 가능 구간 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-loss" />
                        추가 매수 가능 구간
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">매수 구간</span>
                            <Badge variant="outline" className="text-lg font-bold">
                                ₩{accumulationData.zone.minPrice.toLocaleString()} ~ ₩{accumulationData.zone.maxPrice.toLocaleString()}
                            </Badge>
                        </div>

                        {/* 가격 바 시각화 */}
                        <div className="relative h-8 bg-gradient-to-r from-profit via-yellow-500 to-loss rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 bg-primary/30 border-2 border-primary"
                                style={{
                                    left: '20%',
                                    right: '40%',
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>저평가</span>
                            <span>적정가</span>
                            <span>고평가</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">지지선</span>
                            <p className="text-xl font-bold">₩{accumulationData.zone.supportLevel.toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">권장 추가 매수 비중</span>
                            <p className="text-xl font-bold text-primary">{accumulationData.recommendedRatio}%</p>
                        </div>
                    </div>

                    <div>
                        <span className="text-sm text-muted-foreground">밸류에이션 저평가 근거</span>
                        <p className="mt-1">{accumulationData.zone.valuationBasis}</p>
                    </div>
                </CardContent>
            </Card>

            {/* 매수 시점 조건 */}
            <Card>
                <CardHeader>
                    <CardTitle>매수 시점 조건</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {accumulationData.buyConditions.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-3 rounded-lg ${item.met ? 'bg-profit/10 border border-profit/20' : 'bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {item.met ? (
                                        <CheckCircle2 className="h-5 w-5 text-profit" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="font-medium">{item.condition}</p>
                                        <p className="text-sm text-muted-foreground">{item.trigger}</p>
                                    </div>
                                </div>
                                <Badge variant={item.met ? "default" : "secondary"}>
                                    {item.met ? "충족" : "미충족"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
