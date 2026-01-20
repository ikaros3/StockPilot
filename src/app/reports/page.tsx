"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, TrendingUp, PieChart, Loader2 } from "lucide-react";

// 임시 리포트 데이터
const reportsData = [
    {
        id: "1",
        type: "portfolio" as const,
        title: "메인 포트폴리오 종합 리포트",
        generatedAt: "2026-01-19 09:00",
        period: "2026년 1월",
        status: "ready" as const,
    },
    {
        id: "2",
        type: "stock" as const,
        title: "삼성전자 분석 리포트",
        generatedAt: "2026-01-18 15:30",
        period: "2026.01.18",
        status: "ready" as const,
    },
    {
        id: "3",
        type: "weekly" as const,
        title: "주간 포트폴리오 요약",
        generatedAt: "2026-01-15 00:00",
        period: "2026.01.08 - 2026.01.15",
        status: "ready" as const,
    },
];

const reportTypeLabels = {
    portfolio: "포트폴리오",
    stock: "종목 분석",
    weekly: "주간 요약",
};

const reportTypeColors = {
    portfolio: "bg-primary text-primary-foreground",
    stock: "bg-blue-500 text-white",
    weekly: "bg-green-500 text-white",
};

export default function ReportsPage() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (id: string) => {
        setDownloadingId(id);
        // PDF 다운로드 로직
        await new Promise(resolve => setTimeout(resolve, 2000));
        setDownloadingId(null);
        alert("리포트가 다운로드되었습니다. (모의)");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">리포트</h1>
                        <p className="text-muted-foreground">
                            포트폴리오 및 종목 분석 리포트를 확인하고 다운로드하세요.
                        </p>
                    </div>
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        새 리포트 생성
                    </Button>
                </div>

                {/* 리포트 요약 */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">총 리포트</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reportsData.length}개</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">이번 달</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3개</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">포트폴리오 수익률</CardTitle>
                            <TrendingUp className="h-4 w-4 text-profit" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-profit">+25.0%</div>
                        </CardContent>
                    </Card>
                </div>

                {/* 리포트 목록 */}
                <Card>
                    <CardHeader>
                        <CardTitle>리포트 목록</CardTitle>
                        <CardDescription>생성된 리포트를 확인하고 다운로드하세요.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reportsData.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{report.title}</p>
                                                <Badge className={reportTypeColors[report.type]}>
                                                    {reportTypeLabels[report.type]}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {report.period} • 생성: {report.generatedAt}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDownload(report.id)}
                                        disabled={downloadingId === report.id}
                                    >
                                        {downloadingId === report.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" />
                                                다운로드
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
