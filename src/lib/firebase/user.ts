import { usersCollection, getDocument, createDocument, updateDocument, Timestamp } from "./firestore";
import { getAuth } from "firebase/auth";

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    onboardingCompleted: boolean;
    createdAt: any; // Timestamp
    updatedAt: any; // Timestamp
}

/**
 * 사용자 프로필을 가져오거나, 없으면 새로 생성합니다.
 */
export async function getOrCreateUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<UserProfile> {
    const existingProfile = await getDocument<UserProfile>("users", user.uid);

    if (existingProfile) {
        return existingProfile;
    }

    // 프로필인 없으면 생성 (기본값: onboardingCompleted = false)
    const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await createDocument(usersCollection, newProfile, user.uid);
    return newProfile;
}

/**
 * 온보딩 완료 처리
 */
export async function completeOnboarding(uid: string) {
    if (!uid) return;
    await updateDocument("users", uid, { onboardingCompleted: true });
}

/**
 * 온보딩 완료 여부 확인
 */
export async function isOnboardingCompleted(uid: string): Promise<boolean> {
    const profile = await getDocument<UserProfile>("users", uid);
    return !!profile?.onboardingCompleted;
}
