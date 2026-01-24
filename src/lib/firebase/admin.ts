import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// 중앙 설정 파일에서 projectId 가져오기 (하드코딩 제거)
// 주의: config.ts는 클라이언트용이지만 환경변수 로직은 공유 가능
// 하지만 config.ts가 클라이언트 전용 의존성을 가진다면 분리 필요.
// 현재 config.ts는 firebase/app 등을 쓰므로 admin 환경에서 import 시 문제될 수 있음.
// 따라서 안전하게 환경변수를 직접 읽되, 키 이름은 통일.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';

// Cloud Run 환경에서는 서비스 계정 없이 기본 자격 증명 사용
// 로컬 환경에서는 개발 편의를 위해 환경 변수에 GOOGLE_APPLICATION_CREDENTIALS 설정 권장
// 또는 FIREBASE_SERVICE_ACCOUNT 환경 변수가 있다면 사용

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
    if (FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        } catch (error) {
            console.error('Firebase Service Account parsing error:', error);
            initializeApp({ projectId: PROJECT_ID }); // Fallback with explicit projectId
        }
    } else {
        // 로컬/Cloud Run 환경 자동 감지 시에도 projectId 명시 권장
        initializeApp({ projectId: PROJECT_ID });
    }
}

const adminDb = getFirestore();

export { adminDb };
