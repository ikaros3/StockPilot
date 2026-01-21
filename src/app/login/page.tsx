"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, signInWithKakao, signInWithEmail, signOut, deleteCurrentUser, sendVerificationEmail } from "@/lib/firebase/auth";
import { getOrCreateUserProfile, isOnboardingCompleted } from "@/lib/firebase/user";
import { User as FirebaseUser } from "firebase/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await signInWithEmail(email, password);

        if (result.error) {
            setError("이메일 또는 비밀번호가 올바르지 않습니다.");
            setIsLoading(false);
        } else {
            // 이메일 인증 확인
            if (result.user && !result.user.emailVerified) {
                setNeedsVerification(true);
                setCurrentUser(result.user);
                setIsLoading(false);
                return;
            }

            // 온보딩 여부 확인
            if (result.user) {
                try {
                    // 프로필 확인/생성
                    await getOrCreateUserProfile(result.user);
                    const boarded = await isOnboardingCompleted(result.user.uid);

                    if (!boarded) {
                        router.push("/welcome");
                        return;
                    }
                } catch (err) {
                    console.error("Onboarding check failed:", err);
                    // 에러 발생해도 로그인은 허용하거나 처리? 안전하게 메인으로
                }
            }

            router.push("/");
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        const result = await signInWithGoogle();

        if (result.error) {
            console.error("Google Login Error:", result.error);
            setError(`Google 로그인 실패: ${result.error.message} (${(result.error as any).code || 'unknown'})`);
            setIsLoading(false);
            return;
        }

        // 로그인 시도인데 새로운 사용자가 생성된 경우 -> 회원가입이 안 된 상태
        if (result.isNewUser) {
            await deleteCurrentUser(); // 사용자 삭제 (롤백)
            setError("회원가입이 필요합니다. 회원가입 페이지에서 먼저 가입해주세요.");
            setIsLoading(false);
            return;
        }

        if (result.user && !result.user.emailVerified) {
            setNeedsVerification(true);
            setCurrentUser(result.user);
            setIsLoading(false);
            return;
        }

        // 온보딩 여부 확인
        if (result.user) {
            try {
                // 기존 유저이므로 프로필이 있을 것임. 확인차 호출.
                await getOrCreateUserProfile(result.user);
                const boarded = await isOnboardingCompleted(result.user.uid);

                if (!boarded) {
                    router.push("/welcome");
                    return;
                }
            } catch (err) {
                console.error("Onboarding check failed:", err);
            }
        }

        router.push("/");
    };

    const handleKakaoLogin = async () => {
        setIsLoading(true);
        setError(null);

        const result = await signInWithKakao();

        if (result.error) {
            console.error("Kakao login error:", result.error);
            // 에러 메시지 사용자 친화적으로 변환
            let msg = "카카오 로그인에 실패했습니다.";
            if (result.error.message.includes("auth/operation-not-allowed")) {
                msg = "카카오 로그인이 활성화되지 않았습니다. 관리자에게 문의하세요.";
            } else if (result.error.message.includes("auth/popup-closed-by-user")) {
                msg = "로그인 창이 닫혔습니다.";
            }
            setError(msg);
            setIsLoading(false);
            return;
        }

        // 로그인 시도인데 새로운 사용자가 생성된 경우 -> 회원가입이 안 된 상태
        if (result.isNewUser) {
            await deleteCurrentUser(); // 사용자 삭제 (롤백)
            setError("회원가입이 필요합니다. 회원가입 페이지에서 먼저 가입해주세요.");
            setIsLoading(false);
            return;
        }

        if (result.user && !result.user.emailVerified) {
            setNeedsVerification(true);
            setCurrentUser(result.user);
            setIsLoading(false);
            return;
        }

        // 온보딩 여부 확인
        if (result.user) {
            try {
                await getOrCreateUserProfile(result.user);
                const boarded = await isOnboardingCompleted(result.user.uid);

                if (!boarded) {
                    router.push("/welcome");
                    return;
                }
            } catch (err) {
                console.error("Onboarding check failed:", err);
            }
        }

        router.push("/");
    };

    const handleResendVerification = async () => {
        if (!currentUser) return;

        setIsLoading(true);
        const result = await sendVerificationEmail(currentUser);

        if (result.error) {
            console.error("인증 메일 재발송 실패:", result.error);
            setError("메일 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } else {
            setEmailSent(true);
            setError(null);
        }
        setIsLoading(false);
    };

    const handleBackToLogin = async () => {
        await signOut();
        setNeedsVerification(false);
        setCurrentUser(null);
        setEmailSent(false);
        setError(null);
        setPassword("");
    };

    if (needsVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl">이메일 인증 필요</CardTitle>
                        <CardDescription>
                            서비스를 이용하려면 이메일 인증이 필요합니다.<br />
                            가입하신 이메일을 확인해주세요.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {emailSent && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm text-center">
                                인증 메일이 재발송되었습니다.
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleResendVerification}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            인증 메일 재발송
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleBackToLogin}
                        >
                            로그인 화면으로 돌아가기
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center gap-2">
                        <PieChart className="h-10 w-10 text-primary" />
                        <span className="text-2xl font-bold">StockPilot</span>
                    </div>
                    <div>
                        <CardTitle className="text-xl">로그인</CardTitle>
                        <CardDescription>
                            포트폴리오 분석을 시작하세요
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Google 로그인 */}
                    <Button
                        variant="outline"
                        className="w-full h-12"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google로 로그인
                            </>
                        )}
                    </Button>

                    {/* Kakao 로그인 */}
                    <Button
                        className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-black border-none"
                        onClick={handleKakaoLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 3C5.925 3 1 6.925 1 11.775c0 2.9 1.75 5.5 4.525 7.125-.175.65-.625 2.3-.725 2.65-.125.425.15.425.325.3l3.75-2.5c.7.1 1.425.15 2.125.15 6.075 0 11-3.925 11-8.775C22 6.925 17.075 3 12 3z" />
                                </svg>
                                카카오로 로그인
                            </>
                        )}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">또는</span>
                        </div>
                    </div>

                    {/* 이메일 로그인 */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="이메일"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="비밀번호"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <Button type="submit" className="w-full h-12" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    로그인
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        계정이 없으신가요?{" "}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            회원가입
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
