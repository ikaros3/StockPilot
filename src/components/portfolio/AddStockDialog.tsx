"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchStocks, type StockInfo } from "@/data/stock-master";

interface AddStockDialogProps {
    portfolioId: string;
    onStockAdded?: () => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

// 마켓 레이블 색상
const MARKET_COLORS: Record<string, string> = {
    KOSPI: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    KOSDAQ: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    ETF: "bg-green-500/10 text-green-600 border-green-500/20",
};

export function AddStockDialog({ portfolioId, onStockAdded }: AddStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
    const [purchasePrice, setPurchasePrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(getTodayString());
    const [memo, setMemo] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // 종목 검색 결과 (코스피, 코스닥, ETF 전체 검색)
    const filteredStocks = useMemo(() => {
        return searchStocks(searchQuery, { limit: 15 });
    }, [searchQuery]);

    // 외부 클릭 시 suggestions 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 종목 선택
    const handleSelectStock = (stock: StockInfo) => {
        setSelectedStock(stock);
        setSearchQuery("");
        setShowSuggestions(false);
    };

    // 종목 추가
    const handleAddStock = async () => {
        if (!selectedStock || !purchasePrice || !quantity) {
            setError("필수 항목을 모두 입력해주세요.");
            return;
        }

        const price = parseFloat(purchasePrice);
        const qty = parseInt(quantity);

        if (isNaN(price) || price <= 0) {
            setError("올바른 매수가를 입력해주세요.");
            return;
        }

        if (isNaN(qty) || qty <= 0) {
            setError("올바른 수량을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 포트폴리오 서비스 동적 import
            const { addHolding } = await import("@/services/portfolio");

            await addHolding({
                portfolioId,
                stockCode: selectedStock.code,
                stockName: selectedStock.name,
                purchasePrice: price,
                quantity: qty,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                memo: memo.trim() || undefined,
            });

            // 성공 시 다이얼로그 닫고 콜백 호출
            setOpen(false);
            resetForm();
            onStockAdded?.();
        } catch (err) {
            console.error("종목 추가 실패:", err);
            setError("종목 추가에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    // 폼 초기화
    const resetForm = () => {
        setSelectedStock(null);
        setPurchasePrice("");
        setQuantity("");
        setPurchaseDate(getTodayString());
        setMemo("");
        setSearchQuery("");
        setError(null);
        setShowSuggestions(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    종목 추가
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>종목 추가</DialogTitle>
                    <DialogDescription>
                        포트폴리오에 새로운 종목을 추가합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 종목 검색/선택 */}
                    {!selectedStock ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">종목 선택 <span className="text-destructive">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="종목명 또는 종목코드를 입력하세요"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="pl-9"
                                    autoComplete="off"
                                />

                                {/* 검색 결과 리스트 */}
                                {showSuggestions && searchQuery.trim() && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg z-50"
                                    >
                                        {filteredStocks.length > 0 ? (
                                            filteredStocks.map((stock) => (
                                                <button
                                                    key={stock.code}
                                                    type="button"
                                                    className={cn(
                                                        "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                                        "flex items-center justify-between gap-2"
                                                    )}
                                                    onClick={() => handleSelectStock(stock)}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-[10px] px-1.5 py-0 shrink-0", MARKET_COLORS[stock.market])}
                                                        >
                                                            {stock.market}
                                                        </Badge>
                                                        <span className="font-medium truncate">{stock.name}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground shrink-0">{stock.code}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                                                검색 결과가 없습니다
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                종목명 또는 6자리 종목코드를 입력하면 자동으로 검색됩니다
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">선택된 종목</label>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                                <div>
                                    <p className="font-medium">{selectedStock.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedStock.code}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedStock(null)}
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 매수일 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">매수일 <span className="text-muted-foreground">(선택)</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                className="pl-9"
                                max={getTodayString()}
                            />
                        </div>
                    </div>

                    {/* 매수가, 수량 - 한 줄에 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">매수가 (원) <span className="text-destructive">*</span></label>
                            <Input
                                type="number"
                                placeholder="예: 65000"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">수량 (주) <span className="text-destructive">*</span></label>
                            <Input
                                type="number"
                                placeholder="예: 100"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 메모 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">메모 <span className="text-muted-foreground">(선택)</span></label>
                        <Input
                            placeholder="매수 이유, 목표가 등을 기록하세요"
                            value={memo}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemo(e.target.value)}
                        />
                    </div>

                    {/* 예상 투자금액 표시 */}
                    {purchasePrice && quantity && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">예상 투자금액</p>
                            <p className="text-lg font-bold">
                                ₩{(parseFloat(purchasePrice) * parseInt(quantity) || 0).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* 오류 메시지 */}
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        취소
                    </Button>
                    <Button onClick={handleAddStock} disabled={isLoading || !selectedStock}>
                        {isLoading ? "추가 중..." : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
