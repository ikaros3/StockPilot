"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";

interface StockChartProps {
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
}

export function StockChart({ data, height = 400, purchasePrice }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

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
                vertLines: { color: 'rgba(197, 203, 206, 0.3)' },
                horzLines: { color: 'rgba(197, 203, 206, 0.3)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
                timeVisible: true,
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true,
                    price: false,
                },
            },
        });
        chartRef.current = chart;

        // 2. 데이터 가공 (날짜 오름차순 정렬 및 포맷 변환)
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

        // YYYYMMDD -> YYYY-MM-DD
        const formatTime = (dateStr: string): Time => {
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}` as Time;
        };

        // 3. 캔들스틱 시리즈 추가
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#3b82f6',
            borderVisible: false,
            wickUpColor: '#ef4444',
            wickDownColor: '#3b82f6',
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

        // 매수가 라인 추가
        if (purchasePrice) {
            candlestickSeries.createPriceLine({
                price: purchasePrice,
                color: '#9333ea', // purple-600
                lineWidth: 2,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: '매수가',
            });
        }

        // 4. 거래량 시리즈 추가 (Overlay)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // 메인 차트와 겹치되, 스케일은 분리하지 않음 (단, margins로 위치 조정)
        });

        // 거래량을 하단 20%에만 표시하도록 설정
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // 상단 80% 비움
                bottom: 0,
            },
        });

        volumeSeries.setData(
            sortedData.map((item) => ({
                time: formatTime(item.date),
                value: item.volume,
                color: item.closePrice >= item.openPrice ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            }))
        );

        // 5. 이동평균선 계산 및 추가
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

        const ma5 = chart.addSeries(LineSeries, { color: '#10b981', lineWidth: 1, title: '5일' });
        const ma20 = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: '20일' });
        const ma60 = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, title: '60일' });
        const ma120 = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 1, title: '120일' });

        ma5.setData(calculateMA(5));
        ma20.setData(calculateMA(20));
        ma60.setData(calculateMA(60));
        ma120.setData(calculateMA(120));

        // 6. 반응형 처리
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        // 7. 차트 전체가 보이도록 자동 스케일 조정
        chart.timeScale().fitContent();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, height, purchasePrice]);

    return (
        <div ref={chartContainerRef} className="w-full relative" />
    );
}
