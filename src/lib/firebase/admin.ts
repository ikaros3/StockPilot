import * as admin from 'firebase-admin';

// Environment variables
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let db: admin.firestore.Firestore | null = null;

/**
 * Firebase Admin SDK를 초기화하고 인스턴스를 반환합니다.
 */
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

        // Cloud Run / Local Fallback
        if (PROJECT_ID) {
            return admin.initializeApp({ projectId: PROJECT_ID });
        }

        return admin.initializeApp();
    } catch (error: any) {
        // 이미 초기화된 경우 재사용
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        console.error('Firebase Admin Initialization Error:', error);
        throw error;
    }
}

/**
 * Firestore DB 인스턴스를 반환합니다.
 */
export function getAdminDb(): admin.firestore.Firestore {
    if (db) return db;

    try {
        const adminApp = initAdmin();
        db = admin.firestore(adminApp);
        return db;
    } catch (error) {
        console.error('Failed to get Firestore DB:', error);
        // DB 연결 실패 시 에러가 전체 서비스를 멈추지 않도록 처리하는 것이 중요하나, 
        // 여기서는 상위에서 호출 시 에러 처리가 되도록 함.
        throw error;
    }
}

// 하위 호환성을 위해 유지하되, 사용 시 주의
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;


