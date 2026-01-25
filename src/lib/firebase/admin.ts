import { createRequire } from 'module';

/**
 * Firebase Admin SDK Singleton (Canonical Method)
 * 
 * 사용자님께서 지목하신 "이전에 정상 작동했던 버전"의 로직을 완벽하게 복원했습니다.
 * 이 방식은 createRequire와 동적 문자열 템플릿을 조합하여 Turbopack의 정적 분석을 우회하고,
 * 런타임에 표준 Node.js require를 통해 모듈을 안정적으로 로드합니다.
 */

const require = createRequire(import.meta.url);

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let app: any;
let db: any;

function initAdmin() {
    if (app) return app;

    // 패키지 이름을 변수로 분리하고 템플릿 리터럴을 사용하여 번들러의 수정을 방지합니다.
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
                console.log("[Firebase Admin] Initialized with Service Account Key.");
            } catch (error) {
                console.error('Firebase Service Account parsing error:', error);
                if (PROJECT_ID) {
                    app = initializeApp({ projectId: PROJECT_ID });
                } else {
                    app = initializeApp();
                }
            }
        } else {
            // GCP/Firebase 클라우드 환경용 ADC 지원
            if (PROJECT_ID) {
                app = initializeApp({ projectId: PROJECT_ID });
                console.log("[Firebase Admin] Initialized with Project ID (ADC).");
            } else {
                app = initializeApp();
                console.log("[Firebase Admin] Initialized with Default Credentials.");
            }
        }
    } else {
        app = getApp();
    }
    return app;
}

/**
 * Firestore DB 인스턴스 획득
 */
export function getAdminDb() {
    if (!db) {
        const adminApp = initAdmin();
        const PKG = 'firebase-admin';
        const { getFirestore } = require(`${PKG}/firestore`);
        db = getFirestore(adminApp);
    }
    return db;
}

// 기존 코드와의 호환성 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
