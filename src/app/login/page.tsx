"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, signInWithKakao, signInWithEmail, signOut, deleteCurrentUser, sendVerificationEmail, handleRedirectResult } from "@/lib/firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getOrCreateUserProfile, isOnboardingCompleted, getUserProfile } from "@/lib/firebase/user";

export default function LoginPage() {
    console.log("[LoginPage] Rendered");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [emailSent, setEmailSent] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]); // 디버그 로그

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    // 리다이렉트 및 로그인 상태 통합 확인
    useEffect(() => {
        let isMounted = true;
        const auth = getFirebaseAuth();

        const checkAuth = async () => {
            try {
                addLog("[CheckAuth] Start handling redirect result...");

                if (auth) {
                    const config = auth.app.options as any;
                    addLog(`[Config] Host: ${window.location.hostname}`);
                    addLog(`[Config] Protocol: ${window.location.protocol}`);
                    addLog(`[Config] Eth Domain: ${config.authDomain || 'MISSING'}`);
                    addLog(`[Config] API Key: ${config.apiKey ? 'Set' : 'MISSING'}`);
                }

                // 1. Redirect 결과 확인 (우선순위 높음 - isNewUser 정보 때문)
                const result = await handleRedirectResult();

                if (result.user) {
                    addLog(`[CheckAuth] Redirect Success! User: ${result.user.email}`);
                    if (isMounted) await handleLoginSuccess(result.user, result.isNewUser);
                    return;
                }

                if (result.error) {
                    addLog(`[CheckAuth] Redirect Error: ${result.error.message}`);
                    if (isMounted) {
                        setError("로그인 처리 중 오류가 발생했습니다.");
                        setIsLoading(false);
                    }
                    return;
                }

                addLog("[CheckAuth] No redirect result found. Waiting for observer...");
            } catch (err) {
                addLog(`[CheckAuth] Failed: ${err}`);
                if (isMounted) setIsLoading(false);
            }
        };

        checkAuth();

        // Observer: 리다이렉트 감지가 실패했더라도, Auth 상태가 변하면 로그인 처리
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user && isMounted) {
                    addLog(`[Observer] User detected: ${user.email}`);
                    await handleLoginSuccess(user, false);
                } else if (isMounted) {
                    addLog("[Observer] No user found.");
                    // 일정 시간 후에도 유저 없으면 로딩 해제 (여기서는 즉시 해제해봄)
                    setIsLoading(false);
                }
            });
            return () => {
                isMounted = false;
                unsubscribe();
            };
        } else {
            addLog("[CheckAuth] No Auth instance found.");
            if (isMounted) setIsLoading(false);
        }

        return () => { isMounted = false; };
    }, [router]);

    const handleLoginSuccess = async (user: FirebaseUser, isNewUser: boolean = false) => {
        addLog(`[LoginSuccess] Processing user (New: ${isNewUser})`);

        if (isNewUser) {
            await deleteCurrentUser();
            setError("회원가입이 필요합니다. 회원가입 페이지에서 먼저 가입해주세요.");
            setIsLoading(false);
            return;
        }

        if (!user.emailVerified) {
            setNeedsVerification(true);
            setCurrentUser(user);
            setIsLoading(false);
            return;
        }

        try {
            // 로그인 페이지에서는 '있는 유저'만 허용해야 함.
            // getOrCreateUserProfile 대신 getUserProfile로 확인
            const existingProfile = await getUserProfile(user.uid);

            if (!existingProfile) {
                // 프로필이 없다 = 회원가입한 적이 없다.
                // 소셜 로그인으로 자동 생성된 Auth 유저는 삭제하고 가입 페이지로 안내
                await deleteCurrentUser();
                await signOut();
                setError("가입되지 않은 계정입니다. 회원가입 후에 이용해주세요.");

                // 잠시 후 회원가입 페이지로 이동 (UX 옵션)
                // setTimeout(() => router.push("/signup"), 2000);
                setIsLoading(false);
                return;
            }

            const boarded = existingProfile.onboardingCompleted;

            addLog(`[LoginSuccess] Onboarding completed: ${boarded}`);
            if (!boarded) {
                router.push("/welcome");
            } else {
                router.push("/");
            }
        } catch (err) {
            console.error("Onboarding check failed:", err);
            router.push("/"); // 에러 시 안전하게 메인으로
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        addLog("[EmailLogin] Attempting...");

        const result = await signInWithEmail(email, password);

        if (result.error) {
            addLog(`[EmailLogin] Error: ${result.error.message}`);
            setError("이메일 또는 비밀번호가 올바르지 않습니다.");
            setIsLoading(false);
        } else {
            if (result.user) {
                await handleLoginSuccess(result.user, false);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        addLog("[GoogleLogin] Starting...");
        await signInWithGoogle();
    };

    const handleKakaoLogin = async () => {
        setIsLoading(true);
        setError(null);
        addLog("[KakaoLogin] Starting...");
        await signInWithKakao();
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

                {/* 디버그 오버레이 */}
                <div className="fixed bottom-0 left-0 right-0 h-40 bg-black/80 text-green-400 p-4 font-mono text-xs overflow-auto z-50 pointer-events-none opacity-80">
                    <div className="font-bold border-b border-green-500 mb-2">DEBUG CONSOLE</div>
                    {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
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

            {/* 디버그 오버레이 */}
            <div className="fixed bottom-0 left-0 right-0 h-40 bg-black/80 text-green-400 p-4 font-mono text-xs overflow-auto z-50 pointer-events-none opacity-80">
                <div className="font-bold border-b border-green-500 mb-2">DEBUG CONSOLE</div>
                {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
