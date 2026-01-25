import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK 초기화 (Canonical Modular Pattern)
 * 
 * Next.js 15/16 및 Firebase Hosting 'webframeworks' 최적화:
 * - 서브패키지(/app, /firestore)를 사용하여 ESM 트리쉐이킹을 지원합니다.
 * - 프로젝트의 초기 성공적인 대화 맥락을 반영한 정석적인 초기화 방식입니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

function initAdmin(): App {
    // 이미 초기화된 앱이 있으면 재사용
    if (getApps().length > 0) return getApp();

    try {
        // 1. 서비스 계정이 키가 환경변수로 있는 경우
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        // 2. 관리자 환경 (GCP/Firebase)에서 실행 중인 경우 ADC 활용
        if (PROJECT_ID) {
            return initializeApp({ projectId: PROJECT_ID });
        }

        // 3. 대체 수단 (Default)
        return initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return getApp();
        }
        console.error('Firebase Admin Initialization Error:', error);
        throw error;
    }
}

/**
 * Firestore DB 인스턴스를 반환합니다.
 */
export function getAdminDb(): Firestore {
    // 서버 환경인 경우에만 초기화 진행
    if (typeof window !== 'undefined') {
        throw new Error('[Firebase Admin] Cannot be used in client environments.');
    }
    const adminApp = initAdmin();
    return getFirestore(adminApp);
}

// 하위 호환성을 위해 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
