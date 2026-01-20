"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/lib/firebase/auth";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

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
                setError("회원가입에 실패했습니다. 다시 시도해주세요.");
            }
            setIsLoading(false);
        } else {
            router.push("/");
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
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        이미 계정이 있으신가요?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            로그인
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
