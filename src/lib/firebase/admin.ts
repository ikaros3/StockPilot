import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let db: Firestore | null = null;

function initAdmin(): App {
    const apps = getApps();
    if (apps.length > 0) return apps[0];

    if (FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            const pId = serviceAccount.project_id || PROJECT_ID;
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: pId
            });
        } catch (error) {
            console.error('Firebase Service Account parsing error:', error);
            if (PROJECT_ID) {
                return initializeApp({ projectId: PROJECT_ID });
            }
            return initializeApp();
        }
    } else {
        // Cloud Run / Local Fallback
        if (PROJECT_ID) {
            return initializeApp({ projectId: PROJECT_ID });
        }
        return initializeApp();
    }
}

export function getAdminDb(): Firestore {
    if (!db) {
        const adminApp = initAdmin();
        db = getFirestore(adminApp);
    }
    return db;
}

// 하위 호환성을 위해 유지하되, 사용 시 주의
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;


