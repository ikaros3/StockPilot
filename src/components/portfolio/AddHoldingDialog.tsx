"use client";

import { useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
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

interface AddHoldingDialogProps {
    portfolioId: string;
    onSubmit: (data: {
        stockCode: string;
        stockName: string;
        purchasePrice: number;
        quantity: number;
        purchaseDate: string;
    }) => Promise<void>;
    trigger?: React.ReactNode;
}

export function AddHoldingDialog({ portfolioId, onSubmit, trigger }: AddHoldingDialogProps) {
    const [open, setOpen] = useState(false);
    const [stockCode, setStockCode] = useState("");
    const [stockName, setStockName] = useState("");
    const [purchasePrice, setPurchasePrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockCode.trim() || !stockName.trim() || !purchasePrice || !quantity) return;

        setIsLoading(true);
        try {
            await onSubmit({
                stockCode: stockCode.trim(),
                stockName: stockName.trim(),
                purchasePrice: Number(purchasePrice),
                quantity: Number(quantity),
                purchaseDate,
            });
            setOpen(false);
            resetForm();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStockCode("");
        setStockName("");
        setPurchasePrice("");
        setQuantity("");
        setPurchaseDate(new Date().toISOString().split("T")[0]);
    };

    // 종목 코드로 이름 자동 조회 (모의)
    const searchStock = async () => {
        if (stockCode === "005930") setStockName("삼성전자");
        else if (stockCode === "035720") setStockName("카카오");
        else if (stockCode === "122630") setStockName("KODEX 레버리지");
        else setStockName(`종목 ${stockCode}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        종목 추가
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>종목 추가</DialogTitle>
                    <DialogDescription>
                        보유 종목을 추가하여 분석을 시작하세요.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* 종목 코드 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">종목 코드 *</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="예: 005930"
                                    value={stockCode}
                                    onChange={(e) => setStockCode(e.target.value)}
                                    required
                                />
                                <Button type="button" variant="outline" onClick={searchStock}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* 종목명 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">종목명 *</label>
                            <Input
                                placeholder="종목 코드 검색 시 자동 입력"
                                value={stockName}
                                onChange={(e) => setStockName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 매수가 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">매수가 (원) *</label>
                                <Input
                                    type="number"
                                    placeholder="65,000"
                                    value={purchasePrice}
                                    onChange={(e) => setPurchasePrice(e.target.value)}
                                    required
                                />
                            </div>

                            {/* 수량 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">수량 (주) *</label>
                                <Input
                                    type="number"
                                    placeholder="100"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* 매수일 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">매수일</label>
                            <Input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                        </div>

                        {/* 총 투자금액 미리보기 */}
                        {purchasePrice && quantity && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">총 투자금액</p>
                                <p className="text-lg font-bold">
                                    ₩{(Number(purchasePrice) * Number(quantity)).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={isLoading || !stockCode.trim() || !stockName.trim()}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "추가"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
