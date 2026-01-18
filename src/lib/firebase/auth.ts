import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile,
} from "firebase/auth";
import { auth } from "./config";
import { useState, useEffect } from "react";

/**
 * Google 로그인
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: error as Error };
    }
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: error as Error };
    }
}

/**
 * 회원가입
 */
export async function signUp(email: string, password: string, displayName: string) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // 사용자 프로필 업데이트
        await updateProfile(result.user, { displayName });

        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: error as Error };
    }
}

/**
 * 로그아웃
 */
export async function signOut() {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error) {
        return { error: error as Error };
    }
}

/**
 * 인증 상태 관리 훅
 */
export function useAuth() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}

/**
 * 현재 사용자 가져오기
 */
export function getCurrentUser() {
    return auth.currentUser;
}
