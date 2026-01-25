import * as admin from 'firebase-admin';

/**
 * Firebase Admin Singleton 패턴
 * Next.js 15+ Standalone 빌드 환경에서 모듈 누락 방지를 위해 
 * 루트 패키지를 통해 초기화하는 가장 보수적이고 안정적인 방식입니다.
 */

// 환경 변수 로드
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let cachedDb: admin.firestore.Firestore | null = null;

function initAdmin(): admin.app.App {
    // 1. 이미 초기화된 앱이 있으면 재사용 (Hot Reload 대응)
    const apps = admin.apps;
    if (apps.length > 0) return apps[0]!;

    try {
        // 2. 서비스 계정 JSON이 직접 설정된 경우 (로컬/특수 목적)
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        // 3. 배포 환경(GCP/Firebase) - 가급적 기본 ADC 인증 사용
        // PROJECT_ID만 있어도 GCP 환경의 기본 서비스 계정 권한으로 자동 로그인됩니다.
        if (PROJECT_ID) {
            return admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        // 4. 최후의 수단: 환경 정보가 전혀 없으면 자동으로 추론 시도
        return admin.initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        console.error('Firebase Admin Initialization FAILED:', error);
        throw error;
    }
}

/**
 * Firestore DB 인스턴스 획득
 */
export function getAdminDb(): admin.firestore.Firestore {
    if (cachedDb) return cachedDb;

    const app = initAdmin();
    // admin.firestore()를 통해 인스턴스 획득 (번들러 경로 오류 최소화)
    cachedDb = admin.firestore(app);
    return cachedDb;
}

// 기존 코드와의 호환성 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
