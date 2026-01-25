import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 초기화 (Canonical Root Pattern)
 * 
 * Next.js 16/15 Turbopack 환경에서의 모듈 해석 오류를 방지하기 위해 
 * 서브경로(/app, /firestore)가 아닌 루트 패키지 import 방식을 사용합니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

function initAdmin(): admin.app.App {
    // 1. 이미 초기화된 경우 재사용
    if (admin.apps.length > 0) return admin.app();

    try {
        // 2. 서비스 계정 키가 명시적으로 제공된 경우
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        // 3. 배포 환경(GCP/Firebase) - 프로젝트 ID만으로 ADC 기반 자동 초기화
        if (PROJECT_ID) {
            return admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        // 4. 로컬 에뮬레이터 또는 기타 환경
        return admin.initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        console.error('[Firebase Admin] Initialization ERROR:', error);
        throw error;
    }
}

/**
 * Firestore DB 인스턴스를 반환합니다.
 */
export function getAdminDb(): admin.firestore.Firestore {
    if (typeof window !== 'undefined') {
        throw new Error('[Firebase Admin] Cannot be used in client environments.');
    }
    const app = initAdmin();
    // 루트 admin 객체를 통해 firestore 인스턴스 획득 (경로 해석 오류 방지)
    return admin.firestore(app);
}

// 하위 호환성을 위해 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
