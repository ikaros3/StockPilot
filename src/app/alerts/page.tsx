"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, XCircle, Target, TrendingUp, TrendingDown, AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 알림 타입 정의
type AlertStatus = "unread" | "read";
type AlertItemType = "target_reached" | "profit_milestone" | "stop_loss" | "price_above" | "price_below";

interface AlertItem {
    id: string;
    type: AlertItemType;
    stockName: string;
    stockCode: string;
    message: string;
    triggeredAt: string;
    status: AlertStatus;
}

// 임시 알림 데이터
const alertsData: AlertItem[] = [
    {
        id: "1",
        type: "target_reached",
        stockName: "삼성전자",
        stockCode: "005930",
        message: "목표가 ₩85,000 도달!",
        triggeredAt: "2026-01-19 10:30",
        status: "unread",
    },
    {
        id: "2",
        type: "profit_milestone",
        stockName: "KODEX 레버리지",
        stockCode: "122630",
        message: "+20% 수익률 달성!",
        triggeredAt: "2026-01-18 15:45",
        status: "unread",
    },
    {
        id: "3",
        type: "stop_loss",
        stockName: "카카오",
        stockCode: "035720",
        message: "손절선 ₩40,000 근접",
        triggeredAt: "2026-01-18 11:20",
        status: "read",
    },
];

const alertIcons = {
    target_reached: Target,
    profit_milestone: TrendingUp,
    stop_loss: AlertTriangle,
    price_above: TrendingUp,
    price_below: TrendingDown,
};

const alertColors = {
    target_reached: "text-profit",
    profit_milestone: "text-profit",
    stop_loss: "text-destructive",
    price_above: "text-profit",
    price_below: "text-loss",
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState(alertsData);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const filteredAlerts = alerts.filter(
        (alert) => filter === "all" || alert.status === "unread"
    );

    const markAsRead = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id ? { ...a, status: "read" as const } : a
        ));
    };

    const deleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const markAllAsRead = () => {
        setAlerts(alerts.map(a => ({ ...a, status: "read" as const })));
    };

    const unreadCount = alerts.filter(a => a.status === "unread").length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">알림 센터</h1>
                        <p className="text-muted-foreground">
                            종목 알림 및 리포트 업데이트를 확인하세요.
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>
                            모두 읽음 처리
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as "all" | "unread")}>
                    <TabsList>
                        <TabsTrigger value="all">전체</TabsTrigger>
                        <TabsTrigger value="unread" className="relative">
                            읽지 않음
                            {unreadCount > 0 && (
                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {unreadCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <AlertList
                            alerts={filteredAlerts}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteAlert}
                        />
                    </TabsContent>

                    <TabsContent value="unread" className="mt-4">
                        <AlertList
                            alerts={filteredAlerts}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteAlert}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function AlertList({
    alerts,
    onMarkAsRead,
    onDelete,
}: {
    alerts: typeof alertsData;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    if (alerts.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">알림이 없습니다</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert) => {
                const Icon = alertIcons[alert.type] || Bell;
                const iconColor = alertColors[alert.type] || "text-primary";

                return (
                    <Card
                        key={alert.id}
                        className={cn(
                            "transition-all",
                            alert.status === "unread" && "border-l-4 border-l-primary bg-primary/5"
                        )}
                    >
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className={cn("p-2 rounded-full bg-muted", iconColor)}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{alert.stockName}</Badge>
                                    {alert.status === "unread" && (
                                        <Badge variant="secondary" className="text-xs">NEW</Badge>
                                    )}
                                </div>
                                <p className="font-medium mt-1">{alert.message}</p>
                                <p className="text-sm text-muted-foreground">{alert.triggeredAt}</p>
                            </div>

                            <div className="flex gap-2">
                                {alert.status === "unread" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onMarkAsRead(alert.id)}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(alert.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
