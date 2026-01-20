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
import { getFirebaseAuth, isFirebaseConfigured } from "./config";
import { useState, useEffect } from "react";

/**
 * Firebase가 설정되지 않았을 때 반환할 오류
 */
const FIREBASE_NOT_CONFIGURED_ERROR = new Error(
    "Firebase가 설정되지 않았습니다. 인증 기능을 사용하려면 Firebase 환경 변수를 설정하세요."
);

/**
 * Google 로그인
 */
export async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) {
        return { user: null, error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

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
    const auth = getFirebaseAuth();
    if (!auth) {
        return { user: null, error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

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
    const auth = getFirebaseAuth();
    if (!auth) {
        return { user: null, error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

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
    const auth = getFirebaseAuth();
    if (!auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

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
        const auth = getFirebaseAuth();
        if (!auth) {
            // Firebase 미설정 시 로딩 완료 및 사용자 null로 설정
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading, isConfigured: isFirebaseConfigured };
}

/**
 * 현재 사용자 가져오기
 */
export function getCurrentUser() {
    const auth = getFirebaseAuth();
    return auth?.currentUser || null;
}
