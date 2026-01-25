import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 초기화 (Canonical Singleton) - Final Production Stabilized
 * 
 * Next.js 16/15 아키텍처 연동 전략:
 * 1. 루트 패키지 import를 사용하여 번들러의 서브경로 분석 오류(Hashing)를 원천 차단합니다.
 * 2. GCP(Cloud Run)의 기본 인증 체계인 ADC(Application Default Credentials)를 최우선으로 지원합니다.
 * 3. 지연 초기화(Lazy Initialization)를 통해 서버 사이드 런타임에서만 활성화됩니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let cachedDb: admin.firestore.Firestore | null = null;
let initializationFailed = false;

function initAdmin(): admin.app.App {
    // 1. 이미 초기화된 경우 재사용
    const apps = admin.apps;
    if (apps.length > 0) return apps[0]! as admin.app.App;

    try {
        // 2. 서비스 계정 키가 명시적인 경우 (로컬 또는 특수 목적)
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        // 3. 배포 환경 (GCP/Firebase) - 표준 ADC 초기화
        if (PROJECT_ID) {
            return admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        // 4. 최후의 수단
        return admin.initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        console.error('[Firebase Admin] Emergency Initialization FAILED:', error);
        initializationFailed = true;
        throw error;
    }
}

/**
 * Firestore DB 인스턴스 획득 (Singleton)
 * 
 * 정석 가이드: Next.js 서버 컴포넌트 및 API Route에서 안전하게 호출 가능합니다.
 */
export function getAdminDb(): admin.firestore.Firestore {
    if (typeof window !== 'undefined') {
        throw new Error('[Firebase Admin] Cannot be used in client environments.');
    }

    if (cachedDb) return cachedDb;
    if (initializationFailed) {
        throw new Error('[Firebase Admin] DB is unavailable due to previous initialization failure.');
    }

    const app = initAdmin();
    // 루트 admin 객체의 firestore() 메서드를 호출하여 인스턴스를 획득합니다.
    cachedDb = admin.firestore(app);
    return cachedDb;
}

// 하위 호환성을 위해 유지 (사용은 지양하고 getAdminDb() 권장)
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
