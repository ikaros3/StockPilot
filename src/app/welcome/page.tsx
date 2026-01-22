"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, ArrowRight, PartyPopper, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { completeOnboarding } from "@/lib/firebase/user";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function WelcomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const auth = getFirebaseAuth();
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // 로그인 안 된 상태면 로그인 페이지로
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleStart = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            await completeOnboarding(userId);
            router.push("/");
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            // 에러 나도 일단 메인으로
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                        <PartyPopper className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">환영합니다!</CardTitle>
                        <CardDescription className="text-lg pt-2">
                            StockPilot에 처음 오신 것을 환영합니다.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        이제 StockPilot과 함께<br />
                        당신의 포트폴리오를 스마트하게 분석해보세요.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full h-12 text-lg"
                        onClick={handleStart}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <>
                                시작하기
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
