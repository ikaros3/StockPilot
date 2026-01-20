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
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px]">종목명</TableHead>
                        <TableHead className="text-right">현재가</TableHead>
                        <TableHead className="text-right">등락</TableHead>
                        <TableHead className="text-right">평가금액</TableHead>
                        <TableHead className="text-right">평가수익</TableHead>
                        <TableHead className="text-right">수익률</TableHead>
                        <TableHead className="text-right">보유수량</TableHead>
                        <TableHead className="text-right">평균단가</TableHead>
                        <TableHead className="text-right">매수금액</TableHead>
                        <TableHead className="text-right">투자비중</TableHead>
                        <TableHead className="text-center w-[60px]">상세</TableHead>
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
                                {/* 종목명 + 종목코드 */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{holding.stockName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {holding.stockCode}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* 현재가 */}
                                <TableCell className={cn(
                                    "text-right font-medium",
                                    holding.currentPrice === null
                                        ? "text-muted-foreground italic"
                                        : isPriceUp ? PROFIT_COLOR : LOSS_COLOR
                                )}>
                                    {holding.currentPrice !== null ? formatCurrency(holding.currentPrice) : "N/A"}
                                </TableCell>

                                {/* 등락 (전일대비) */}
                                <TableCell className={cn(
                                    "text-right text-sm",
                                    holding.priceChange === null
                                        ? "text-muted-foreground italic"
                                        : isPriceUp ? PROFIT_COLOR : LOSS_COLOR
                                )}>
                                    {holding.priceChange !== null ? (
                                        <div className="flex flex-col items-end">
                                            <span>{formatChange(priceChange)}</span>
                                            <span className="text-xs">({formatPercent(priceChangeRate)})</span>
                                        </div>
                                    ) : "N/A"}
                                </TableCell>

                                {/* 평가금액 */}
                                <TableCell className={cn(
                                    "text-right font-medium",
                                    holding.evaluationAmount === null && "text-muted-foreground italic"
                                )}>
                                    {holding.evaluationAmount !== null ? formatCurrency(holding.evaluationAmount) : "N/A"}
                                </TableCell>

                                {/* 평가수익 */}
                                <TableCell className={cn(
                                    "text-right font-medium",
                                    holding.profit === null
                                        ? "text-muted-foreground italic"
                                        : isProfit ? PROFIT_COLOR : LOSS_COLOR
                                )}>
                                    {holding.profit !== null ? formatChange(holding.profit) : "N/A"}
                                </TableCell>

                                {/* 수익률 */}
                                <TableCell className={cn(
                                    "text-right font-medium",
                                    holding.profitRate === null
                                        ? "text-muted-foreground italic"
                                        : isProfit ? PROFIT_COLOR : LOSS_COLOR
                                )}>
                                    {holding.profitRate !== null ? formatPercent(holding.profitRate) : "N/A"}
                                </TableCell>

                                {/* 보유수량 */}
                                <TableCell className="text-right">
                                    {formatNumber(holding.quantity)}주
                                </TableCell>

                                {/* 평균단가 */}
                                <TableCell className="text-right">
                                    {formatCurrency(holding.purchasePrice)}
                                </TableCell>

                                {/* 매수금액 */}
                                <TableCell className="text-right">
                                    {formatCurrency(investmentAmount)}
                                </TableCell>

                                {/* 투자비중 */}
                                <TableCell className="text-right">
                                    {weight.toFixed(1)}%
                                </TableCell>

                                {/* 상세분석보기 */}
                                <TableCell className="text-center">
                                    <Link
                                        href={`/stocks/${holding.stockCode}`}
                                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent transition-colors"
                                        title="상세 분석 보기"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
