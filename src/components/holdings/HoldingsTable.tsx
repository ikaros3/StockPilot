"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PerformanceStatus } from "@/types";

export interface HoldingData {
    id: string;
    stockCode: string;
    stockName: string;
    purchasePrice: number;
    quantity: number;
    currentPrice: number | null;      // API 실패 시 null
    evaluationAmount: number | null;  // API 실패 시 null
    profit: number | null;            // API 실패 시 null
    profitRate: number | null;        // API 실패 시 null
    performanceStatus: PerformanceStatus;
    priceChange?: number | null;      // 전일대비 등락
    priceChangeRate?: number | null;  // 전일대비 등락률
    isApiSuccess?: boolean;           // API 호출 성공 여부
}

interface HoldingsTableProps {
    holdings: HoldingData[];
    totalInvestment: number;
    selectedStockCode?: string;
    onRowClick?: (holding: HoldingData) => void;
}

/**
 * 숫자를 천단위 콤마 포맷으로 변환
 */
function formatNumber(num: number): string {
    return num.toLocaleString("ko-KR");
}

/**
 * 금액을 원화 포맷으로 변환
 */
function formatCurrency(num: number): string {
    return `${formatNumber(Math.round(num))}원`;
}

/**
 * 퍼센트 포맷
 */
function formatPercent(num: number): string {
    const sign = num >= 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
}

/**
 * 등락 금액 포맷
 */
function formatChange(num: number): string {
    const sign = num >= 0 ? "+" : "";
    return `${sign}${formatNumber(Math.round(num))}원`;
}

// 전역 CSS 변수 사용 (globals.css에 정의됨)
const PROFIT_COLOR = "text-profit";
const LOSS_COLOR = "text-loss";

export function HoldingsTable({
    holdings,
    totalInvestment,
    selectedStockCode,
    onRowClick
}: HoldingsTableProps) {
    if (holdings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">보유 종목이 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    종목을 추가하여 포트폴리오를 구성해 보세요.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent text-[11px] sm:text-xs text-muted-foreground">
                        <TableHead className="px-2 h-10 w-[110px] sm:w-[140px]">종목</TableHead>
                        <TableHead className="px-2 h-10 text-right">현재가/등락</TableHead>
                        <TableHead className="px-2 h-10 text-right">수익/수익률</TableHead>
                        <TableHead className="px-2 h-10 text-right">수량/평단</TableHead>
                        <TableHead className="px-2 h-10 text-right">매수/평가액</TableHead>
                        <TableHead className="px-1 h-10 text-center w-[40px]">상세</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {holdings.map((holding) => {
                        const investmentAmount = holding.purchasePrice * holding.quantity;
                        const weight = totalInvestment > 0
                            ? (investmentAmount / totalInvestment) * 100
                            : 0;
                        const isProfit = (holding.profit ?? 0) >= 0;
                        const priceChange = holding.priceChange ?? 0;
                        const priceChangeRate = holding.priceChangeRate ?? 0;
                        const isPriceUp = priceChange >= 0;
                        const isSelected = selectedStockCode === holding.stockCode;

                        return (
                            <TableRow
                                key={holding.id}
                                className={cn(
                                    "cursor-pointer transition-colors",
                                    isSelected
                                        ? "bg-primary/10 hover:bg-primary/15"
                                        : "hover:bg-muted/50"
                                )}
                                onClick={() => onRowClick?.(holding)}
                            >
                                {/* 종목 + 코드/비중 */}
                                <TableCell className="px-2 py-2.5">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs sm:text-sm leading-tight truncate max-w-[100px] sm:max-w-none">
                                            {holding.stockName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground leading-tight">
                                            {holding.stockCode} · {weight.toFixed(1)}%
                                        </span>
                                    </div>
                                </TableCell>

                                {/* 현재가 / 등락 */}
                                <TableCell className="px-2 py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "font-medium text-xs sm:text-sm leading-tight",
                                            holding.currentPrice === null
                                                ? "text-muted-foreground italic"
                                                : isPriceUp ? PROFIT_COLOR : LOSS_COLOR
                                        )}>
                                            {holding.currentPrice !== null ? formatNumber(holding.currentPrice) : "N/A"}
                                        </span>
                                        {holding.priceChange !== null && (
                                            <span className={cn(
                                                "text-[9px] sm:text-[10px] leading-tight font-medium",
                                                isPriceUp ? PROFIT_COLOR : LOSS_COLOR
                                            )}>
                                                {isPriceUp ? "▲" : "▼"}{formatNumber(Math.abs(priceChange))} ({priceChangeRate.toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* 수익 / 수익률 */}
                                <TableCell className="px-2 py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "font-medium text-xs sm:text-sm leading-tight",
                                            holding.profit === null
                                                ? "text-muted-foreground italic"
                                                : isProfit ? PROFIT_COLOR : LOSS_COLOR
                                        )}>
                                            {holding.profit !== null ? formatNumber(Math.round(holding.profit)) : "N/A"}
                                        </span>
                                        {holding.profitRate !== null && (
                                            <span className={cn(
                                                "text-[9px] sm:text-[10px] leading-tight font-medium",
                                                isProfit ? PROFIT_COLOR : LOSS_COLOR
                                            )}>
                                                {formatPercent(holding.profitRate)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* 수량 / 평단 */}
                                <TableCell className="px-2 py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-medium text-xs sm:text-sm leading-tight">
                                            {formatNumber(holding.quantity)}주
                                        </span>
                                        <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
                                            {formatNumber(Math.round(holding.purchasePrice))}원
                                        </span>
                                    </div>
                                </TableCell>

                                {/* 매수/평가액 */}
                                <TableCell className="px-2 py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs sm:text-sm leading-tight">
                                            {formatNumber(Math.round(investmentAmount))}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] sm:text-[10px] font-semibold leading-tight",
                                            holding.evaluationAmount === null
                                                ? "text-muted-foreground italic"
                                                : isProfit ? PROFIT_COLOR : LOSS_COLOR
                                        )}>
                                            {holding.evaluationAmount !== null
                                                ? formatNumber(Math.round(holding.evaluationAmount))
                                                : "N/A"}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* 상세 */}
                                <TableCell className="px-1 py-2.5 text-center">
                                    <Link
                                        href={`/stocks/${holding.stockCode}`}
                                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent transition-colors"
                                        title="상세 분석"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
