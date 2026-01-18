import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types";

/**
 * 인증 상태 인터페이스
 */
interface AuthState {
    // 상태
    firebaseUser: FirebaseUser | null;
    userProfile: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // 액션
    setFirebaseUser: (user: FirebaseUser | null) => void;
    setUserProfile: (profile: User | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

/**
 * 인증 스토어
 */
export const useAuthStore = create<AuthState>()((set) => ({
    // 초기 상태
    firebaseUser: null,
    userProfile: null,
    isAuthenticated: false,
    isLoading: true,

    // 액션
    setFirebaseUser: (firebaseUser) => set({
        firebaseUser,
        isAuthenticated: !!firebaseUser,
    }),

    setUserProfile: (userProfile) => set({ userProfile }),

    setLoading: (isLoading) => set({ isLoading }),

    reset: () => set({
        firebaseUser: null,
        userProfile: null,
        isAuthenticated: false,
        isLoading: false,
    }),
}));
