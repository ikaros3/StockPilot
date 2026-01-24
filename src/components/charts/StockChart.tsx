"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time, CandlestickSeries, HistogramSeries, LineSeries, ISeriesApi } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface StockChartProps {
    stockCode: string;
    data: {
        date: string;
        openPrice: number;
        highPrice: number;
        lowPrice: number;
        closePrice: number;
        volume: number;
    }[];
    purchasePrice?: number;
    height?: number;
    period?: string;
    onPeriodChange?: (period: string) => void;
}

const MA_COLORS = {
    5: '#10b981',   // Emerald 500
    20: '#f59e0b',  // Amber 500
    60: '#8b5cf6',  // Violet 500
    120: '#ec4899', // Pink 500
};

export function StockChart({ stockCode, data, height = 400, purchasePrice, period = "D", onPeriodChange }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // 이동평균선 표시 상태 (5, 20, 60, 120)
    const [visibleMAs, setVisibleMAs] = useState<number[]>([5, 20, 60]);

    const toggleMA = (days: number) => {
        setVisibleMAs(prev =>
            prev.includes(days)
                ? prev.filter(d => d !== days)
                : [...prev, days]
        );
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 1. 차트 생성
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#333',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    visible: true,
                    labelVisible: true,
                },
                horzLine: {
                    visible: true,
                    labelVisible: true,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
                timeVisible: true,
            },
            localization: {
                priceFormatter: (price: number) => Math.round(price).toLocaleString(),
                timeFormatter: (time: Time) => {
                    // 문자열(YYYY-MM-DD)인 경우 그대로 반환
                    if (typeof time === 'string') return time;

                    // Timestamp인 경우 변환
                    const date = new Date((time as number) * 1000);
                    const year = date.getUTCFullYear();
                    const month = date.getUTCMonth() + 1;
                    const day = date.getUTCDate();
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                },
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true,
                    price: false,
                },
            },
        });
        chartRef.current = chart;

        // Price Scale (Main) 설정 - 하단 여백 확보 (Volume 영역과의 겹침 방지)
        chart.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.01, // 상단 여백 최소화 (1%)
                bottom: 0.3, // 하단 30%를 비워둠 (Volume 영역)
            },
        });

        // 2. 데이터 가공
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

        // Format Date
        const formatTime = (dateStr: string): Time => {
            if (dateStr.length === 14) { // YYYYMMDDHHMMSS
                // TimeStamp로 변환 (UTC 기준)
                // KIS 시간은 KST. 
                // Lightweight charts는 timestamp를 UTC로 해석하여 출력 (옵션에 따라 로컬 시간 변환)
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6)) - 1;
                const day = parseInt(dateStr.substring(6, 8));
                const hour = parseInt(dateStr.substring(8, 10));
                const minute = parseInt(dateStr.substring(10, 12));

                // UTC 타임스탬프로 변환 (9시간 빼야하나요? 차트 설정에 따름. 
                // 일단 Date.UTC를 사용하여 해당 시간을 UTC로 간주하고 넘기면 차트가 그대로 표시함)
                return (Date.UTC(year, month, day, hour, minute) / 1000) as Time;
            }
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}` as Time;
        };

        // 3. 캔들스틱 시리즈
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#3b82f6',
            borderVisible: false,
            wickUpColor: '#ef4444',
            wickDownColor: '#3b82f6',
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => Math.round(price).toLocaleString(),
                minMove: 1,
            },
        });

        candlestickSeries.setData(
            sortedData.map((item) => ({
                time: formatTime(item.date),
                open: item.openPrice,
                high: item.highPrice,
                low: item.lowPrice,
                close: item.closePrice,
            }))
        );

        // 매수가 라인
        if (purchasePrice) {
            candlestickSeries.createPriceLine({
                price: purchasePrice,
                color: '#9333ea',
                lineWidth: 2,
                lineStyle: 2,
                axisLabelVisible: true,
                title: '매수가',
            });
        }

        // 4. 거래량 시리즈
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.75, // 상단 75% 비움 (Price 영역)
                bottom: 0,
            },
        });

        volumeSeries.setData(
            sortedData.map((item) => ({
                time: formatTime(item.date),
                value: item.volume,
                color: item.closePrice >= item.openPrice ? '#ef4444' : '#3b82f6',
            }))
        );

        // 거래량 Axis Label 제거
        volumeSeries.applyOptions({
            priceScaleId: '', // Overlay 적용 시 priceScaleId 설정
            // HistogramSeriesOptions에는 lastValueVisible이 없을 수 있음 (SeriesOptionsCommon에 있음)
            lastValueVisible: false,
            priceLineVisible: false,
        });

        // 5. 이동평균선
        const calculateMA = (days: number) => {
            return sortedData.map((item, index, array) => {
                if (index < days - 1) return null;
                const slice = array.slice(index - days + 1, index + 1);
                const sum = slice.reduce((acc, cur) => acc + cur.closePrice, 0);
                return {
                    time: formatTime(item.date),
                    value: sum / days,
                };
            }).filter((item): item is { time: Time; value: number } => item !== null);
        };

        [5, 20, 60, 120].forEach(days => {
            if (visibleMAs.includes(days)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const series = chart.addSeries(LineSeries, {
                    color: MA_COLORS[days as keyof typeof MA_COLORS],
                    lineWidth: 1,
                    title: '', // 제목 제거 (범례 표시 안함)
                    lastValueVisible: false,
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                    priceFormat: {
                        type: 'custom',
                        formatter: (price: number) => Math.round(price).toLocaleString(),
                        minMove: 1,
                    },
                });
                series.setData(calculateMA(days));
            }
        });

        // 6. 반응형 처리 (ResizeObserver)
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length === 0 || !entries[0].target) return;
            const newRect = entries[0].contentRect;
            chart.applyOptions({ width: newRect.width });
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        chart.timeScale().fitContent();

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [data, height, purchasePrice, visibleMAs, period]); // period 추가

    return (
        <div className="w-full flex flex-col gap-1 relative">
            {/* 상단 툴바 */}
            <div className="flex flex-wrap items-center justify-start gap-4 py-1 px-2 border-b border-primary/5 bg-muted/10">
                {/* 상세 분석 버튼 (가장 중요한 기능 - 왼쪽 배치 및 시인성 강화) */}
                <Link href={`/stocks/${stockCode}`}>
                    <Button
                        size="sm"
                        className="gap-1.5 h-7 text-[11px] font-bold bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white shadow-sm shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 px-3"
                    >
                        <ExternalLink className="h-3 w-3" />
                        상세 분석
                    </Button>
                </Link>

                <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />

                <div className="flex items-center gap-6">
                    {/* 기간 선택 */}
                    <div className="flex items-center gap-1 bg-background/50 p-0.5 rounded-sm border border-border/50">
                        {["1m", "D", "W", "M", "Y"].map((p) => {
                            const labelMap: Record<string, string> = { "1m": "1분", "D": "일", "W": "주", "M": "월", "Y": "년" };
                            return (
                                <button
                                    key={p}
                                    onClick={() => onPeriodChange?.(p)}
                                    className={cn(
                                        "px-2 py-0.5 text-[10px] font-medium rounded-sm transition-colors",
                                        period === p
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                                    )}
                                >
                                    {labelMap[p]}
                                </button>
                            );
                        })}
                    </div>

                    {/* 이동평균선 토글 */}
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground font-medium mr-1">이동평균선</span>
                        {[5, 20, 60].map((days) => (
                            <button
                                key={days}
                                onClick={() => toggleMA(days)}
                                className={cn(
                                    "font-bold transition-opacity",
                                    visibleMAs.includes(days) ? "opacity-100" : "opacity-30 hover:opacity-100"
                                )}
                                style={{
                                    color: visibleMAs.includes(days)
                                        ? MA_COLORS[days as keyof typeof MA_COLORS]
                                        : '#888'
                                }}
                            >
                                {days}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative w-full">
                <div ref={chartContainerRef} className="w-full" />
                {/* 구분선 (Top 72.5% 지점) */}
                <div className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30 pointer-events-none" style={{ top: '72.5%' }}></div>
            </div>
        </div>
    );
}
