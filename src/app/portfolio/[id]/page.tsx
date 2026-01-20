"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddStockDialog } from "@/components/portfolio/AddStockDialog";
import { EditStockDialog } from "@/components/portfolio/EditStockDialog";
// import { OrderBook } from "@/components/stock/OrderBook";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // 포트폴리오 데이터 훅 사용
    const {
        portfolio,
        holdings,
        isLoading,
        isError,
        deletePortfolio,
        reloadAll
    } = usePortfolio(id);

    const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);

    // 보유 종목이 로드되면 첫 번째 종목을 기본 선택
    useEffect(() => {
        if (holdings.length > 0 && !selectedStockCode) {
            setSelectedStockCode(holdings[0].stockCode);
        }
    }, [holdings, selectedStockCode]);

    // 포트폴리오 삭제 처리
    const handleDeletePortfolio = async () => {
        try {
            await deletePortfolio();
            router.push("/"); // 대시보드로 이동
        } catch (error) {
            console.error("포트폴리오 삭제 실패:", error);
            alert("포트폴리오 삭제 중 오류가 발생했습니다.");
        }
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    // 에러 또는 데이터 없음
    if (isError || !portfolio) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <h2 className="text-2xl font-bold">포트폴리오를 찾을 수 없습니다</h2>
                    <p className="text-muted-foreground">요청하신 포트폴리오가 존재하지 않거나 삭제되었습니다.</p>
                    <Button onClick={() => router.push("/")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        대시보드로 돌아가기
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // 수익률 계산 (단순 예시, 실제로는 현재가 필요)
    // 현재는 purchasePrice를 현재가로 가정하거나 별도 API 호출 필요
    // 여기서는 usePortfolio 데이터에 의존 (현재가 미포함 -> purchasePrice로 대체 표시)
    // 향후 useRealtimeData 연동 필요

    const totalInvestment = holdings.reduce((sum, h) => sum + (h.purchasePrice * h.quantity), 0);
    // 현재가 데이터가 없으므로 투자금액 = 평가금액으로 임시 표시 (추후 개선 포인트)
    const currentValuation = totalInvestment;
    const totalProfit = 0;
    const profitRate = 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -ml-2"
                                onClick={() => router.push("/")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-2xl font-bold tracking-tight">{portfolio.name}</h1>
                            <Badge variant="outline" className="ml-2">
                                {holdings.length}개 종목
                            </Badge>
                        </div>
                        <p className="text-muted-foreground ml-8">
                            {portfolio.description || "설명이 없습니다."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-8 sm:ml-0">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    포트폴리오 삭제
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>포트폴리오 삭제</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        정말로 '{portfolio.name}' 포트폴리오를 삭제하시겠습니까?
                                        <br />포함된 모든 보유 종목 데이터가 함께 삭제됩니다.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeletePortfolio} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        삭제
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AddStockDialog portfolioId={id} onStockAdded={reloadAll} />
                    </div>
                </div>

                <Separator />

                {/* 요약 카드 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 투자금액</CardTitle>
                            <div className="h-4 w-4 text-muted-foreground">₩</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalInvestment.toLocaleString()}원
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">총 평가금액</CardTitle>
                            <div className="h-4 w-4 text-muted-foreground">₩</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {currentValuation.toLocaleString()}원
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                * 현재가 연동 필요
                            </p>
                        </CardContent>
                    </Card>

                    {/* 추가 요약 카드들... */}
                </div>

                {/* 메인 컨텐츠: 보유 종목 및 호가창 */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* 왼쪽: 보유 종목 리스트 (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>보유 종목</CardTitle>
                                <Button variant="ghost" size="sm" onClick={reloadAll} className="h-8 gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    새로고침
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>종목명</TableHead>
                                            <TableHead className="text-right">수량</TableHead>
                                            <TableHead className="text-right">평균단가</TableHead>
                                            <TableHead className="text-right">평가금액</TableHead>
                                            <TableHead className="text-center">관리</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {holdings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    보유한 종목이 없습니다.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            holdings.map((holding) => (
                                                <TableRow
                                                    key={holding.id}
                                                    className={cn(
                                                        "cursor-pointer hover:bg-muted/50",
                                                        selectedStockCode === holding.stockCode && "bg-muted"
                                                    )}
                                                    onClick={() => setSelectedStockCode(holding.stockCode)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div>{holding.stockName}</div>
                                                        <div className="text-xs text-muted-foreground">{holding.stockCode}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {holding.quantity.toLocaleString()}주
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {holding.purchasePrice.toLocaleString()}원
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {(holding.purchasePrice * holding.quantity).toLocaleString()}원
                                                    </TableCell>
                                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <EditStockDialog
                                                            holding={holding}
                                                            onStockUpdated={reloadAll}
                                                            onStockDeleted={reloadAll}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 오른쪽: 호가창 및 차트 (1/3) */}
                    <div className="space-y-6">
                        {selectedStockCode ? (
                            <div className="sticky top-20 space-y-6">
                                {/* <OrderBook 
                                    stockCode={selectedStockCode}
                                    stockName={holdings.find(h => h.stockCode === selectedStockCode)?.stockName}
                                /> */}
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        차트 준비 중입니다.<br />
                                        (호가창 기능은 제외되었습니다)
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="sticky top-20">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    종목을 선택하면<br />상세 정보가 표시됩니다.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
