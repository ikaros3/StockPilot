"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    PieChart,
    FileText,
    Settings,
    Bell,
    Plus,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Search,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CreatePortfolioDialog } from "@/components/portfolio";
import { createPortfolio, getUserPortfolios } from "@/services/portfolio";
import type { Portfolio } from "@/types";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

interface PortfolioWithStats extends Portfolio {
    holdingCount?: number;
    profitRate?: number;
}

const navItems = [
    { href: "/", label: "투자현황", icon: PieChart },
    { href: "/reports", label: "리포트", icon: FileText },
    { href: "/alerts", label: "알림 센터", icon: Bell },
    { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [portfolios, setPortfolios] = useState<PortfolioWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 포트폴리오 목록 로드
    const loadPortfolios = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getUserPortfolios("demo_user");
            // 임시로 holdingCount와 profitRate 추가
            const portfoliosWithStats = data.map((p) => ({
                ...p,
                holdingCount: 0,
                profitRate: 0,
            }));
            setPortfolios(portfoliosWithStats);
        } catch (error) {
            console.error("[Sidebar] 포트폴리오 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPortfolios();
    }, [loadPortfolios]);

    // 포트폴리오 생성
    const handleCreatePortfolio = async (name: string, description: string) => {
        try {
            const newPortfolio = await createPortfolio({
                userId: "demo_user",
                name,
                description,
            });

            // 목록 새로고침
            await loadPortfolios();

            // 새 포트폴리오 페이지로 이동
            router.push(`/portfolio/${newPortfolio.id}`);
        } catch (error) {
            console.error("[Sidebar] 포트폴리오 생성 실패:", error);
            throw error;
        }
    };

    return (
        <>
            {/* 모바일 오버레이 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* 사이드바 */}
            <aside
                className={cn(
                    "fixed top-16 z-40 h-[calc(100vh-4rem)] w-72 border-r bg-background transition-transform duration-300 md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* 모바일 닫기 버튼 */}
                    <div className="flex items-center justify-between p-4 md:hidden">
                        <span className="font-semibold">메뉴</span>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 px-3">
                        {/* 검색 */}
                        <div className="py-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="종목 검색..."
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {/* 네비게이션 */}
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                            isActive
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                        onClick={onClose}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <Separator className="my-4" />

                        {/* 포트폴리오 목록 */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    포트폴리오
                                </h4>
                                <CreatePortfolioDialog
                                    onSubmit={handleCreatePortfolio}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : portfolios.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        포트폴리오가 없습니다.
                                        <br />
                                        + 버튼을 눌러 생성하세요.
                                    </div>
                                ) : (
                                    portfolios.map((portfolio) => {
                                        const profitRate = portfolio.profitRate ?? 0;
                                        const isProfit = profitRate >= 0;
                                        const TrendIcon = isProfit ? TrendingUp : TrendingDown;

                                        return (
                                            <Link
                                                key={portfolio.id}
                                                href={`/portfolio/${portfolio.id}`}
                                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                                                onClick={onClose}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{portfolio.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {portfolio.holdingCount ?? 0}개 종목
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendIcon className={cn(
                                                        "h-3 w-3",
                                                        isProfit ? "text-profit" : "text-loss"
                                                    )} />
                                                    <span className={cn(
                                                        "text-xs font-medium",
                                                        isProfit ? "text-profit" : "text-loss"
                                                    )}>
                                                        {isProfit ? "+" : ""}{profitRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </aside>
        </>
    );
}
