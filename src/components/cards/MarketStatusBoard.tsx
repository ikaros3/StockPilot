"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
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

const DUMMY_DATA: IndicesResponse = {
    indices: [
        { name: "KOSPI", price: 5003.45, change: 12.34, changeRate: 0.49, isUp: true, isDown: false },
        { name: "KOSDAQ", price: 993.12, change: -2.15, changeRate: -0.26, isUp: false, isDown: true },
        { name: "NASDAQ", price: 15312.56, change: 156.78, changeRate: 1.03, isUp: true, isDown: false },
        { name: "DOW", price: 37865.12, change: 45.32, changeRate: 0.12, isUp: true, isDown: false },
    ],
    isMarketOpen: false
};

export function MarketStatusBoard() {
    const [data, setData] = useState<IndicesResponse>(DUMMY_DATA);
    const [loading, setLoading] = useState(false); // Initially false to show dummy data

    const fetchIndices = async () => {
        try {
            const response = await fetch("/api/market/indices");
            const result = await response.json();
            if (result.indices && result.indices.length > 0) {
                // 데이터가 '데이터 없음'이 아닌 유효한 데이터일 때만 업데이트
                const hasValidData = result.indices.some((idx: IndexData) => !idx.error);
                if (hasValidData) {
                    setData(result);
                }
            }
        } catch (error) {
            console.error("Failed to fetch indices:", error);
        }
    };

    useEffect(() => {
        fetchIndices();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (data?.isMarketOpen) {
            interval = setInterval(fetchIndices, 300000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [data?.isMarketOpen]);

    return (
        <div className="flex flex-col gap-0.5 mb-1">
            <Card className="overflow-hidden border shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0 flex items-stretch divide-x divide-border/50 overflow-x-auto no-scrollbar">
                    {data?.indices.map((index) => (
                        <div
                            key={index.name}
                            className="flex-1 min-w-[120px] sm:min-w-0 px-3 py-2 sm:px-4 sm:py-3 flex flex-col items-center justify-center text-center transition-all hover:bg-accent/20"
                        >
                            {/* 지수명 */}
                            <div className="font-black uppercase tracking-tight mb-1 whitespace-nowrap text-sm sm:text-lg text-foreground">
                                {index.name}
                            </div>

                            {/* 지수값 - 큰 컬러 숫자 */}
                            <div className={cn(
                                "text-xl sm:text-3xl font-black tracking-tighter mb-1 whitespace-nowrap",
                                index.isUp ? "text-red-500" : index.isDown ? "text-blue-500" : "text-foreground"
                            )}>
                                {index.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            {/* 변동값과 변동률 */}
                            <div className={cn(
                                "flex items-center gap-1 text-xs sm:text-sm font-bold whitespace-nowrap",
                                index.isUp ? "text-red-500" : index.isDown ? "text-blue-500" : "text-muted-foreground"
                            )}>
                                {index.isUp && (
                                    <span className="inline-block w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-red-500" />
                                )}
                                {index.isDown && (
                                    <span className="inline-block w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-blue-500" />
                                )}

                                <span>
                                    {index.change > 0 ? "+" : ""}{index.change.toFixed(2)}
                                    ({index.changeRate > 0 ? "+" : ""}{index.changeRate.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/50 py-0.5">
                <Info className="h-2.5 w-2.5" />
                <span>10분 지연</span>
            </div>
        </div>
    );
}
