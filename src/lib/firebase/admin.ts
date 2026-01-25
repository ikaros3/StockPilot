import { createRequire } from 'module';
// const require = createRequire(import.meta.url); // Cloud Run 환경에서 import.meta.url 사용 시 주의 필요할 수 있음. 
// 안전하게 require 그대로 사용 시도하거나 동적 import 사용.
// 하지만 동기 함수 유지를 위해 require가 필요함

const require = createRequire(import.meta.url);

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let app: any;
let db: any;

function initAdmin() {
    if (app) return app;

    // Use require to bypass bundler mangling
    // We construct the path dynamically to prevent Turbopack/Webpack from rewriting the module name
    const PKG = 'firebase-admin';
    const { initializeApp, getApps, cert, getApp } = require(`${PKG}/app`);

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

export function getAdminDb() {
    if (!db) {
        const adminApp = initAdmin();
        const PKG = 'firebase-admin';
        const { getFirestore } = require(`${PKG}/firestore`);
        db = getFirestore(adminApp);
    }
    return db;
}

// 하위 호환성을 위해 유지되, 사용 시 주의
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
