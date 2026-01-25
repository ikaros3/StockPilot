import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 초기화 (Canonical Singleton)
 * 
 * Next.js 16/15 및 Firebase Hosting 'webframeworks' 아키텍처 연동:
 * - Webpack 빌드 파이프라인에서 가장 안정적인 루트 패키지 import 방식을 사용합니다.
 * - 지연 초기화(Lazy Initialization)를 통해 서버 사이드 런타임에서만 활성화됩니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let cachedDb: admin.firestore.Firestore | null = null;

function initAdmin(): admin.app.App {
    const apps = admin.apps;
    if (apps.length > 0) return apps[0]!;

    try {
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        if (PROJECT_ID) {
            return admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        return admin.initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        console.error('[Firebase Admin] Initialization FAILED:', error);
        throw error;
    }
}

/**
 * Firestore DB 인스턴스 획득
 */
export function getAdminDb(): admin.firestore.Firestore {
    if (typeof window !== 'undefined') {
        throw new Error('[Firebase Admin] Cannot be used in client environments.');
    }

    if (cachedDb) return cachedDb;

    const app = initAdmin();
    cachedDb = admin.firestore(app);
    return cachedDb;
}

// 하위 호환성을 위해 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
