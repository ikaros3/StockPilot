import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile,
    sendEmailVerification as firebaseSendEmailVerification,
    getAdditionalUserInfo,
    OAuthProvider,
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
 * 리다이렉트 결과 처리 (로그인 페이지 진입 시 호출)
 */
export async function handleRedirectResult() {
    const auth = getFirebaseAuth();
    if (!auth) {
        return { user: null, isNewUser: false, error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        const result = await getRedirectResult(auth);
        if (!result) {
            return { user: null, isNewUser: false, error: null }; // 리다이렉트 결과 없음 (일반 진입)
        }

        const additionalUserInfo = getAdditionalUserInfo(result);
        const isNewUser = additionalUserInfo?.isNewUser || false;

        return { user: result.user, isNewUser, error: null };
    } catch (error) {
        return { user: null, isNewUser: false, error: error as Error };
    }
}

/**
 * Google 로그인 (Redirect)
 */
export async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    const provider = new GoogleAuthProvider();
    try {
        await signInWithRedirect(auth, provider);
        // 리다이렉트 되므로 반환값 없음
        return { error: null };
    } catch (error) {
        return { error: error as Error };
    }
}

/**
 * Kakao 로그인 (Redirect)
 */
export async function signInWithKakao() {
    const auth = getFirebaseAuth();
    if (!auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    // Firebase Console에서 'oidc.kakao'로 제공업체 설정 필요
    const provider = new OAuthProvider('oidc.kakao');
    provider.addScope('openid');
    provider.addScope('email');

    try {
        await signInWithRedirect(auth, provider);
        // 리다이렉트 되므로 반환값 없음
        return { error: null };
    } catch (error) {
        return { error: error as Error };
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
 * 이메일 인증 메일 발송
 */
export async function sendVerificationEmail(user: FirebaseUser) {
    try {
        await firebaseSendEmailVerification(user);
        return { error: null };
    } catch (error) {
        return { error: error as Error };
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
 * 회원 탈퇴 (사용자 삭제)
 */
export async function deleteCurrentUser() {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) {
        return { error: new Error("No authenticated user.") };
    }

    try {
        await auth.currentUser.delete();
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
