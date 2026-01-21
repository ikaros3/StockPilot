import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * Firebase 설정
 * 
 * 동작 모드:
 * 1. Emulator 모드: NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
 * 2. 프로덕션 모드: Firebase 환경 변수가 설정된 경우
 * 3. LocalStorage 폴백: 위 두 가지 모두 해당되지 않는 경우
 */

// Emulator 사용 여부
export const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

// Firebase 설정 확인
export const isFirebaseConfigured = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Emulator 또는 실제 Firebase 사용 가능 여부
export const canUseFirebase = useEmulator || isFirebaseConfigured;

// 실제 projectId를 사용 (Emulator와 프로덕션 모두에서 동일하게 사용)
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project";

// Firebase 설정
const firebaseConfig = useEmulator
    ? {
        // Emulator 모드: 실제 projectId 사용 (Emulator와 일치)
        apiKey: "demo-api-key",
        authDomain: `${projectId}.firebaseapp.com`,
        projectId: projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: "000000000000",
        appId: "1:000:web:demo",
    }
    : {
        // 실제 Firebase 설정
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    };


// Firebase 앱 인스턴스 (지연 초기화)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Emulator 연결 상태
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

/**
 * Firebase 앱 가져오기 (지연 초기화)
 */
export function getFirebaseApp(): FirebaseApp | null {
    if (!canUseFirebase) {
        console.warn("[Firebase] Firebase 설정이 없습니다. LocalStorage 모드로 전환합니다.");
        return null;
    }

    if (!app) {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

        if (useEmulator) {
            console.log("[Firebase] Emulator 모드로 초기화됨");
            console.log("[Firebase] projectId:", firebaseConfig.projectId);
        } else {
            console.log("[Firebase] 프로덕션 모드로 초기화됨");
        }
    }
    return app;
}

/**
 * Firebase Auth 가져오기
 */
export function getFirebaseAuth(): Auth | null {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    if (!auth) {
        auth = getAuth(firebaseApp);

        // Emulator 연결
        if (useEmulator && !authEmulatorConnected && typeof window !== "undefined") {
            try {
                connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
                console.log("[Firebase] Auth Emulator 연결됨 (localhost:9099)");
                authEmulatorConnected = true;
            } catch (error) {
                console.warn("[Firebase] Auth Emulator 연결 실패:", error);
            }
        }
    }
    return auth;
}

/**
 * Firestore 가져오기
 */
export function getFirestoreDb(): Firestore | null {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    if (!db) {
        db = getFirestore(firebaseApp);

        // Emulator 연결
        if (useEmulator && !firestoreEmulatorConnected && typeof window !== "undefined") {
            try {
                connectFirestoreEmulator(db, "localhost", 8080);
                console.log("[Firebase] Firestore Emulator 연결됨 (localhost:8080)");
                firestoreEmulatorConnected = true;
            } catch (error) {
                console.warn("[Firebase] Firestore Emulator 연결 실패:", error);
            }
        }
    }
    return db;
}

/**
 * 현재 저장소 모드 반환
 */
export function getStorageMode(): "emulator" | "firebase" | "localStorage" {
    if (useEmulator) return "emulator";
    if (isFirebaseConfigured) return "firebase";
    return "localStorage";
}

/**
 * 저장소 모드 라벨 반환 (UI용)
 */
export function getStorageModeLabel(): string {
    const mode = getStorageMode();
    switch (mode) {
        case "emulator":
            return "Emulator";
        case "firebase":
            return "Firebase";
        case "localStorage":
            return "로컬";
    }
}

// 레거시 호환성을 위한 export
export { app, auth, db };
