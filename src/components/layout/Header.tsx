"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    PieChart,
    FileText,
    Settings,
    Bell,
    User,
    LogOut,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick?: () => void;
}

const navItems = [
    { href: "/", label: "투자현황", icon: PieChart },
    { href: "/reports", label: "리포트", icon: FileText },
    { href: "/settings", label: "설정", icon: Settings },
];

export function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
                {/* 모바일 메뉴 버튼 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 md:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">메뉴 열기</span>
                </Button>

                {/* 로고 */}
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <PieChart className="h-6 w-6 text-primary" />
                    <span className="hidden font-bold sm:inline-block">StockPilot</span>
                </Link>

                {/* 메인 네비게이션 */}
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                                    isActive ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 우측 영역 */}
                <div className="flex flex-1 items-center justify-end space-x-4">
                    {/* 알림 버튼 */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">알림</span>
                        {/* 알림 뱃지 */}
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-profit text-[10px] font-medium text-profit-foreground flex items-center justify-center">
                            3
                        </span>
                    </Button>

                    {/* 사용자 메뉴 */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt="사용자" />
                                    <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">사용자</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        user@example.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>프로필</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>설정</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>로그아웃</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
