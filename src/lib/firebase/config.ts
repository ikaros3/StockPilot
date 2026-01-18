import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase 설정
 * 환경 변수에서 Firebase 프로젝트 설정을 로드합니다.
 * 
 * .env.local 파일에 다음 변수들을 설정하세요:
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 (싱글톤 패턴)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
