"use client";

import { Bell, X, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertType } from "@/services/alerts";

interface AlertBannerProps {
    alerts: Array<{
        id: string;
        type: AlertType;
        stockName: string;
        message: string;
        triggeredAt: string;
    }>;
    onDismiss: (id: string) => void;
    onDismissAll: () => void;
}

const alertIcons: Record<AlertType, React.ReactNode> = {
    price_above: <TrendingUp className="h-4 w-4 text-profit" />,
    price_below: <TrendingDown className="h-4 w-4 text-loss" />,
    target_reached: <Target className="h-4 w-4 text-profit" />,
    stop_loss: <AlertTriangle className="h-4 w-4 text-destructive" />,
    profit_milestone: <TrendingUp className="h-4 w-4 text-profit" />,
};

const alertColors: Record<AlertType, string> = {
    price_above: "border-profit/20 bg-profit/5",
    price_below: "border-loss/20 bg-loss/5",
    target_reached: "border-profit/20 bg-profit/5",
    stop_loss: "border-destructive/20 bg-destructive/5",
    profit_milestone: "border-profit/20 bg-profit/5",
};

export function AlertBanner({ alerts, onDismiss, onDismissAll }: AlertBannerProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 w-80 space-y-2">
            {/* 헤더 */}
            {alerts.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-background border rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {alerts.length}개의 알림
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismissAll}
                        className="text-xs"
                    >
                        모두 닫기
                    </Button>
                </div>
            )}

            {/* 알림 목록 */}
            {alerts.slice(0, 5).map((alert) => (
                <div
                    key={alert.id}
                    className={cn(
                        "relative p-4 bg-background border rounded-lg shadow-lg animate-in slide-in-from-right-5",
                        alertColors[alert.type]
                    )}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => onDismiss(alert.id)}
                    >
                        <X className="h-3 w-3" />
                    </Button>

                    <div className="flex items-start gap-3 pr-6">
                        <div className="mt-0.5">
                            {alertIcons[alert.type]}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {alert.stockName}
                                </Badge>
                            </div>
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                                {alert.triggeredAt}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            {alerts.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                    +{alerts.length - 5}개의 알림이 더 있습니다
                </div>
            )}
        </div>
    );
}
