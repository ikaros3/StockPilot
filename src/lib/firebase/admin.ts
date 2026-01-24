import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let app: App | undefined;
let db: Firestore | undefined;

function initAdmin() {
    if (app) return app;

    if (!getApps().length) {
        if (FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
                const pId = serviceAccount.project_id || PROJECT_ID;
                app = initializeApp({
                    credential: cert(serviceAccount),
                    projectId: pId
                });
            } catch (error) {
                console.error('Firebase Service Account parsing error:', error);
                // Fallback attempt
                if (PROJECT_ID) {
                    app = initializeApp({ projectId: PROJECT_ID });
                } else {
                    app = initializeApp();
                }
            }
        } else {
            // Cloud Run / Local Fallback
            if (PROJECT_ID) {
                app = initializeApp({ projectId: PROJECT_ID });
            } else {
                app = initializeApp();
            }
        }
    } else {
        app = getApp();
    }
    return app;
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
    // 필요한 다른 메서드가 있다면 프록시로 추가하거나, 호출 측에서 getAdminDb()를 쓰도록 변경 권장
} as unknown as Firestore; // 임시 타입 캐스팅 (권장하지 않음, 호출부 수정 예정)

