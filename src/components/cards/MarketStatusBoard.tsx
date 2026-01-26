"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const fetchIndices = async () => {
        try {
            const response = await fetch("/api/market/indices");
            const result = await response.json();
            if (result.indices && result.indices.length > 0) {
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
            interval = setInterval(() => {
                fetchIndices();
            }, 300000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [data?.isMarketOpen]);



    return (
        <div className="flex flex-col gap-0.5 mb-1">
            {/* 지수 카드 */}
            <Card className="overflow-hidden border shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0 flex items-stretch divide-x divide-border/50 overflow-x-auto no-scrollbar">
                    {data?.indices.map((index) => (
                        <div
                            key={index.name}
                            className="flex-1 min-w-[120px] sm:min-w-0 px-3 pt-0.5 pb-0 sm:px-4 sm:pt-1 sm:pb-0 flex flex-col items-center justify-center text-center transition-all hover:bg-accent/20"
                        >
                            <div className="font-black uppercase tracking-tight whitespace-nowrap text-xs sm:text-base text-foreground">
                                {index.name}
                            </div>
                            <div className={cn(
                                "text-lg sm:text-2xl font-black tracking-tighter whitespace-nowrap leading-none my-0.5",
                                index.isUp ? "text-red-500" : index.isDown ? "text-blue-500" : "text-foreground"
                            )}>
                                {index.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] sm:text-xs font-bold whitespace-nowrap",
                                index.isUp ? "text-red-500" : index.isDown ? "text-blue-500" : "text-muted-foreground"
                            )}>
                                {index.isUp && (
                                    <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-500" />
                                )}
                                {index.isDown && (
                                    <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-blue-500" />
                                )}
                                <span>
                                    {index.change > 0 ? "+" : ""}{index.change.toFixed(2)}
                                    ({index.changeRate > 0 ? "+" : ""}{index.changeRate.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground/40 pt-0.5 pb-0 bg-muted/5 border-t border-border/10">
                    <Info className="h-3 w-3" />
                    <span>10분 지연</span>
                </div>
            </Card>
        </div>
    );
}
