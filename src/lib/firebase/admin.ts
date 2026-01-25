import { createRequire } from 'module';

/**
 * admin.ts - Final Stability Fix for Next.js 16/Turbopack
 * 
 * [문제 해결 핵심]
 * Next.js 16의 Turbopack 정적 분석기가 'firebase-admin' 서브패키지를 분석하여 
 * 이름을 해싱하는 것을 방지하기 위해 eval('require') 패턴을 사용합니다.
 * 이 방식은 번들러가 빌드 타임에 의존성을 추적하지 못하게 하여, 
 * 실제 Cloud Run 실행 환경의 node_modules에서 깨끗하게 라이브러리를 직접 가져옵니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let app: any;
let db: any;

// Turbopack의 정적 분석을 완전히 우회하는 런타임 require 함수
const safeRequire = (id: string) => {
    try {
        const req = eval('require');
        return req(id);
    } catch (e) {
        // Fallback: eval이 제한된 환경인 경우 createRequire 사용
        const require = createRequire(import.meta.url);
        return require(id);
    }
};

function initAdmin() {
    if (app) return app;

    try {
        const PKG = 'firebase-admin';
        // 서브 모듈 로딩 시 절대 빌드 타임에 경로가 해석되지 않도록 처리
        const { initializeApp, getApps, cert, getApp } = safeRequire(`${PKG}/app`);

        if (!getApps().length) {
            if (FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
                const pId = serviceAccount.project_id || PROJECT_ID;
                app = initializeApp({
                    credential: cert(serviceAccount),
                    projectId: pId
                });
            } else if (PROJECT_ID) {
                app = initializeApp({ projectId: PROJECT_ID });
            } else {
                app = initializeApp();
            }
        } else {
            app = getApp();
        }
        return app;
    } catch (error) {
        console.error('[Firebase Admin Startup Error]:', error);
        return null;
    }
}

export function getAdminDb() {
    if (db) return db;

    const adminApp = initAdmin();
    if (!adminApp) throw new Error('Firebase Admin App failed to initialize.');

    try {
        const PKG = 'firebase-admin';
        const { getFirestore } = safeRequire(`${PKG}/firestore`);
        db = getFirestore(adminApp);
        return db;
    } catch (error) {
        console.error('[Firestore Admin Error]:', error);
        throw error;
    }
}

// 하위 호환성 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
