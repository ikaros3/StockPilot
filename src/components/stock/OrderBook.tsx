"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeOrderbook, getStatusColor, getStatusLabel } from "@/hooks/useRealtimeData";
import { useOrderBook } from "@/hooks/useStockData";

interface OrderBookProps {
    stockCode: string;
    stockName?: string;
}

interface OrderBookItem {
    price: number;
    quantity: number;
}

interface OrderBookData {
    asks: OrderBookItem[];
    bids: OrderBookItem[];
    totalAskQuantity?: number;
    totalBidQuantity?: number;
}

/**
 * 실시간 호가창 컴포넌트
 */
export function OrderBook({ stockCode, stockName }: OrderBookProps) {
    // REST API로 초기 데이터 로드
    const { orderBook: initialOrderbook, isLoading } = useOrderBook(stockCode);

    // WebSocket으로 실시간 업데이트 (선택적)
    const { orderbook: realtimeOrderbook, status } = useRealtimeOrderbook(stockCode);

    // 실시간 데이터가 있으면 사용, 없으면 REST 데이터 사용
    const orderbook: OrderBookData | null = realtimeOrderbook || initialOrderbook;

    if (isLoading && !orderbook) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!orderbook || !Array.isArray(orderbook.asks) || !Array.isArray(orderbook.bids)) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    호가 정보를 불러올 수 없습니다.
                </CardContent>
            </Card>
        );
    }

    // 최대 수량 계산 (막대 그래프 스케일링용)
    const maxQuantity = Math.max(
        ...orderbook.asks.map((a) => a.quantity),
        ...orderbook.bids.map((b) => b.quantity)
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        호가창
                        {stockName && <span className="text-sm font-normal text-muted-foreground">({stockName})</span>}
                    </CardTitle>
                    <Badge variant="outline" className={cn("gap-1", getStatusColor(status))}>
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {getStatusLabel(status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
                    {/* 매도 호가 (빨강) */}
                    <div className="bg-loss/5">
                        <div className="text-center py-2 bg-loss/10 font-medium text-sm text-loss">
                            <TrendingDown className="inline h-4 w-4 mr-1" />
                            매도 호가
                        </div>
                        <div className="divide-y divide-border/50">
                            {orderbook.asks.slice(0, 5).reverse().map((ask, i) => (
                                <div key={i} className="flex items-center p-2 text-sm relative">
                                    {/* 배경 막대 */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 bg-loss/10"
                                        style={{ width: `${(ask.quantity / maxQuantity) * 100}%` }}
                                    />
                                    <div className="relative flex-1 flex justify-between items-center">
                                        <span className="font-medium text-loss">
                                            {ask.price.toLocaleString()}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {ask.quantity.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 매수 호가 (파랑) */}
                    <div className="bg-profit/5">
                        <div className="text-center py-2 bg-profit/10 font-medium text-sm text-profit">
                            <TrendingUp className="inline h-4 w-4 mr-1" />
                            매수 호가
                        </div>
                        <div className="divide-y divide-border/50">
                            {orderbook.bids.slice(0, 5).map((bid, i) => (
                                <div key={i} className="flex items-center p-2 text-sm relative">
                                    {/* 배경 막대 */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-profit/10"
                                        style={{ width: `${(bid.quantity / maxQuantity) * 100}%` }}
                                    />
                                    <div className="relative flex-1 flex justify-between items-center">
                                        <span className="text-muted-foreground">
                                            {bid.quantity.toLocaleString()}
                                        </span>
                                        <span className="font-medium text-profit">
                                            {bid.price.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 총 잔량 */}
                <div className="flex justify-between mt-3 text-sm">
                    <div className="text-loss">
                        총 매도: <strong>{orderbook.totalAskQuantity?.toLocaleString() || "-"}</strong>
                    </div>
                    <div className="text-profit">
                        총 매수: <strong>{orderbook.totalBidQuantity?.toLocaleString() || "-"}</strong>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
