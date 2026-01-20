"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        displayName: "사용자",
        email: "user@example.com",
        investmentStyle: "moderate" as "aggressive" | "moderate" | "conservative",
        targetReturn: 15,
        maxLoss: 10,
        notifications: {
            priceAlerts: true,
            reportUpdates: true,
            weeklyDigest: false,
        },
        theme: "system" as "light" | "dark" | "system",
    });

    const handleSave = async () => {
        setIsSaving(true);
        // 저장 로직
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">설정</h1>
                    <p className="text-muted-foreground">
                        계정 및 앱 설정을 관리합니다.
                    </p>
                </div>

                {/* 프로필 설정 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            프로필
                        </CardTitle>
                        <CardDescription>기본 계정 정보를 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">이름</label>
                                <Input
                                    value={settings.displayName}
                                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">이메일</label>
                                <Input value={settings.email} disabled />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 투자 설정 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            투자 설정
                        </CardTitle>
                        <CardDescription>투자 성향 및 목표를 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">투자 성향</label>
                            <div className="flex gap-2">
                                {(["aggressive", "moderate", "conservative"] as const).map((style) => (
                                    <Button
                                        key={style}
                                        variant={settings.investmentStyle === style ? "default" : "outline"}
                                        onClick={() => setSettings({ ...settings, investmentStyle: style })}
                                        className="flex-1"
                                    >
                                        {style === "aggressive" && "공격적"}
                                        {style === "moderate" && "중립적"}
                                        {style === "conservative" && "보수적"}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">목표 수익률 (%)</label>
                                <Input
                                    type="number"
                                    value={settings.targetReturn}
                                    onChange={(e) => setSettings({ ...settings, targetReturn: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">허용 손실률 (%)</label>
                                <Input
                                    type="number"
                                    value={settings.maxLoss}
                                    onChange={(e) => setSettings({ ...settings, maxLoss: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 알림 설정 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            알림
                        </CardTitle>
                        <CardDescription>알림 수신 설정을 관리합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: "priceAlerts", label: "가격 알림", desc: "목표가/손절선 도달 시 알림" },
                            { key: "reportUpdates", label: "리포트 업데이트", desc: "새 분석 리포트 발행 시 알림" },
                            { key: "weeklyDigest", label: "주간 리포트", desc: "매주 포트폴리오 요약 발송" },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                                <Button
                                    variant={settings.notifications[item.key as keyof typeof settings.notifications] ? "default" : "outline"}
                                    onClick={() => setSettings({
                                        ...settings,
                                        notifications: {
                                            ...settings.notifications,
                                            [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications],
                                        },
                                    })}
                                >
                                    {settings.notifications[item.key as keyof typeof settings.notifications] ? "켜짐" : "꺼짐"}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 테마 설정 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            테마
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            {(["light", "dark", "system"] as const).map((theme) => (
                                <Button
                                    key={theme}
                                    variant={settings.theme === theme ? "default" : "outline"}
                                    onClick={() => setSettings({ ...settings, theme })}
                                    className="flex-1"
                                >
                                    {theme === "light" && "☀️ 라이트"}
                                    {theme === "dark" && "🌙 다크"}
                                    {theme === "system" && "💻 시스템"}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="w-32">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                저장
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
