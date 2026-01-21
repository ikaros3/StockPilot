"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp, signInWithGoogle, signInWithKakao, sendVerificationEmail, signOut } from "@/lib/firebase/auth";
import { getOrCreateUserProfile } from "@/lib/firebase/user";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (email: string) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        setError(null);

        const result = await signInWithGoogle();

        if (result.error) {
            setError("Google 회원가입에 실패했습니다. 다시 시도해주세요.");
            setIsLoading(false);
            return;
        }

        if (result.isNewUser && result.user) {
            // 사용자 프로필 생성 (온보딩 상태 false로 초기화)
            await getOrCreateUserProfile(result.user);

            // 이미 인증된 계정(대부분의 소셜 로그인)이면 바로 로그인 처리 -> 웰컴 페이지로 이동
            if (result.user.emailVerified) {
                router.push("/welcome");
                return;
            }

            // Google 가입이라도 인증되지 않은 경우에만 추후 인증 메일 발송 및 로그아웃 처리
            const emailResult = await sendVerificationEmail(result.user);
            if (emailResult.error) {
                console.error("인증 메일 발송 실패:", emailResult.error);
            }

            await signOut();
            setIsSuccess(true);
            setIsLoading(false);
        } else {
            router.push("/");
        }
    };

    const handleKakaoSignup = async () => {
        setIsLoading(true);
        setError(null);

        const result = await signInWithKakao();

        if (result.error) {
            console.error("Kakao signup error:", result.error);
            setError("카카오 회원가입에 실패했습니다.");
            setIsLoading(false);
            return;
        }

        if (result.isNewUser && result.user) {
            // 사용자 프로필 생성
            await getOrCreateUserProfile(result.user);

            // 이미 인증된 계정이면 바로 로그인 처리 -> 웰컴 페이지로 이동
            if (result.user.emailVerified) {
                router.push("/welcome");
                return;
            }

            const emailResult = await sendVerificationEmail(result.user);
            if (emailResult.error) {
                console.error("인증 메일 발송 실패:", emailResult.error);
            }

            await signOut();
            setIsSuccess(true);
            setIsLoading(false);
        } else {
            // 이미 가입된 경우 로그인 처리됨 -> 메인으로
            router.push("/");
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateEmail(email)) {
            setError("유효한 이메일 주소를 입력해주세요.");
            return;
        }

        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (password.length < 6) {
            setError("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        setIsLoading(true);

        const result = await signUp(email, password, name);

        if (result.error) {
            if (result.error.message.includes("email-already-in-use")) {
                setError("이미 사용 중인 이메일입니다.");
            } else {
                console.error("Signup error:", result.error);
                setError(`회원가입 실패: ${result.error.message} (${(result.error as any).code || 'unknown'})`);
            }
            setIsLoading(false);
        } else {
            // 이메일 인증 메일 발송
            if (result.user) {
                // 사용자 프로필 생성 (온보딩 상태 false로 초기화)
                await getOrCreateUserProfile(result.user);

                const emailResult = await sendVerificationEmail(result.user);
                if (emailResult.error) {
                    console.error("인증 메일 발송 실패:", emailResult.error);
                }

                await signOut(); // 자동 로그인 방지
                setIsSuccess(true);
            }
            setIsLoading(false);
        }
    };

    const passwordRequirements = [
        { met: password.length >= 6, text: "6자 이상" },
        { met: /[A-Za-z]/.test(password), text: "영문 포함" },
        { met: /[0-9]/.test(password), text: "숫자 포함" },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center gap-2">
                        <PieChart className="h-10 w-10 text-primary" />
                        <span className="text-2xl font-bold">StockPilot</span>
                    </div>
                    <div>
                        <CardTitle className="text-xl">회원가입</CardTitle>
                        <CardDescription>
                            계정을 만들고 포트폴리오 분석을 시작하세요
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {isSuccess ? (
                        <div className="text-center space-y-4 py-8">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">인증 메일 발송 완료</h3>
                            <p className="text-muted-foreground">
                                <strong>{email}</strong>로 인증 메일을 보냈습니다.<br />
                                메일을 확인하여 인증을 완료해주세요.
                            </p>
                            <Button asChild className="w-full mt-4">
                                <Link href="/login">로그인 하러 가기</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Google 회원가입 */}
                            <Button
                                variant="outline"
                                className="w-full h-12 mb-4"
                                onClick={handleGoogleSignup}
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
                                        Google로 회원가입
                                    </>
                                )}
                            </Button>

                            {/* Kakao 회원가입 */}
                            <Button
                                className="w-full h-12 mb-4 bg-[#FEE500] hover:bg-[#FDD835] text-black border-none"
                                onClick={handleKakaoSignup}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 3C5.925 3 1 6.925 1 11.775c0 2.9 1.75 5.5 4.525 7.125-.175.65-.625 2.3-.725 2.65-.125.425.15.425.325.3l3.75-2.5c.7.1 1.425.15 2.125.15 6.075 0 11-3.925 11-8.775C22 6.925 17.075 3 12 3z" />
                                        </svg>
                                        카카오로 회원가입
                                    </>
                                )}
                            </Button>

                            <div className="relative mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">또는 이메일로 가입</span>
                                </div>
                            </div>

                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="이름"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>
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

                                    {/* 비밀번호 요구사항 */}
                                    {password && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {passwordRequirements.map((req, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center gap-1 text-xs ${req.met ? "text-profit" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    <Check className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-40"}`} />
                                                    {req.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="비밀번호 확인"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive text-center">{error}</p>
                                )}

                                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            회원가입
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    {!isSuccess && (
                        <div className="text-sm text-center text-muted-foreground">
                            이미 계정이 있으신가요?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                로그인
                            </Link>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
