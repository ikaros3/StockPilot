"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface IndexData {
    name: string;
    price: number;
    change: number;
    changeRate: number;
    isUp: boolean;
    isDown: boolean;
    error?: string;
}

interface IndicesResponse {
    indices: IndexData[];
    isMarketOpen: boolean;
}

export function MarketStatusBoard() {
    const [data, setData] = useState<IndicesResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchIndices = async () => {
        try {
            const response = await fetch("/api/market/indices");
            const result = await response.json();
            if (result.indices) {
                setData(result);
            }
        } catch (error) {
            console.error("Failed to fetch indices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndices();
    }, []);

    useEffect(() => {
        // 장이 열려 있을 때만 5분마다 갱신
        let interval: NodeJS.Timeout | null = null;
        if (data?.isMarketOpen) {
            interval = setInterval(fetchIndices, 300000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [data?.isMarketOpen]);

    if (loading && !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden border-none bg-accent/30 shadow-sm animate-pulse">
                        <CardContent className="p-4 h-24" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.indices.map((index) => (
                    <Card
                        key={index.name}
                        className={cn(
                            "overflow-hidden border-none shadow-sm transition-all hover:bg-accent/40",
                            "bg-gradient-to-br from-background/50 to-accent/20 backdrop-blur-sm"
                        )}
                    >
                        <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {index.name}
                            </span>

                            {index.error ? (
                                <span className="text-sm text-destructive">데이터 없음</span>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold tracking-tight mb-1">
                                        {index.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-medium",
                                        index.isUp ? "text-red-500" : index.isDown ? "text-blue-500" : "text-muted-foreground"
                                    )}>
                                        {index.isUp && <TrendingUp className="h-3 w-3" />}
                                        {index.isDown && <TrendingDown className="h-3 w-3" />}
                                        {!index.isUp && !index.isDown && <Minus className="h-3 w-3" />}

                                        <span>
                                            {index.change > 0 ? "+" : ""}{index.change.toLocaleString()} ({index.changeRate > 0 ? "+" : ""}{index.changeRate}%)
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground pr-1">
                <Info className="h-3 w-3" />
                <span>10분 지연 (해외지수 및 일부 한국지수)</span>
            </div>
        </div>
    );
}
