import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Cloud Run 환경에서는 서비스 계정 없이 기본 자격 증명 사용
// 로컬 환경에서는 개발 편의를 위해 환경 변수에 GOOGLE_APPLICATION_CREDENTIALS 설정 권장
// 또는 FIREBASE_SERVICE_ACCOUNT 환경 변수가 있다면 사용

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
    if (FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (error) {
            console.error('Firebase Service Account parsing error:', error);
            initializeApp(); // Fallback to default credentials
        }
    } else {
        initializeApp();
    }
}

const adminDb = getFirestore();

export { adminDb };
