"use client";

import { useState } from "react";
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
import { Edit, Trash2 } from "lucide-react";

interface Holding {
    id: string;
    stockCode: string;
    stockName: string;
    purchasePrice: number;
    quantity: number;
}

interface EditStockDialogProps {
    holding: Holding;
    onStockUpdated?: () => void;
    onStockDeleted?: () => void;
}

export function EditStockDialog({ holding, onStockUpdated, onStockDeleted }: EditStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [purchasePrice, setPurchasePrice] = useState(holding.purchasePrice.toString());
    const [quantity, setQuantity] = useState(holding.quantity.toString());
    const [error, setError] = useState<string | null>(null);

    // 종목 수정
    const handleUpdateStock = async () => {
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
            const { updateHolding } = await import("@/services/portfolio");

            await updateHolding(holding.id, {
                purchasePrice: price,
                quantity: qty,
            });

            setOpen(false);
            onStockUpdated?.();
        } catch (err) {
            console.error("종목 수정 실패:", err);
            setError("종목 수정에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 종목 삭제
    const handleDeleteStock = async () => {
        setIsLoading(true);

        try {
            const { deleteHolding } = await import("@/services/portfolio");

            await deleteHolding(holding.id);

            setOpen(false);
            onStockDeleted?.();
        } catch (err) {
            console.error("종목 삭제 실패:", err);
            setError("종목 삭제에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">수정</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>종목 수정</DialogTitle>
                    <DialogDescription>
                        {holding.stockName} ({holding.stockCode})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 매수가 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">매수가 (원)</label>
                        <Input
                            type="number"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                        />
                    </div>

                    {/* 수량 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">수량 (주)</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>

                    {/* 예상 투자금액 표시 */}
                    {purchasePrice && quantity && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">총 투자금액</p>
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

                <DialogFooter className="gap-2 sm:gap-0">
                    {/* 삭제 버튼 */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                삭제
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>종목 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {holding.stockName}을(를) 포트폴리오에서 삭제하시겠습니까?
                                    <br />이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteStock}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    삭제
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* 저장 버튼 */}
                    <Button onClick={handleUpdateStock} disabled={isLoading}>
                        {isLoading ? "저장 중..." : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
