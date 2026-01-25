import * as admin from 'firebase-admin';

/**
 * [최종 안정화 버전] firebase-admin 초기화
 * 
 * next.config.ts의 serverExternalPackages 설정과 결합하여
 * 빌드 타임의 해싱 오류를 원천 차단하고 실행 시점의 안정성을 보장합니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

let cachedDb: admin.firestore.Firestore | null = null;

function initAdmin(): admin.app.App {
    // 1. 중복 초기화 방지 (Next.js 핫 리로딩 대응)
    const apps = admin.apps;
    if (apps.length > 0) return apps[0]! as admin.app.App;

    try {
        // 2. 서비스 계정 키가 있는 경우 (로컬/특수 목적)
        if (FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || PROJECT_ID
            });
        }

        // 3. 배포 환경 (GCP/Firebase) - ADC 자동 감지
        if (PROJECT_ID) {
            return admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        // 4. 최후의 수단
        return admin.initializeApp();
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            return admin.app() as admin.app.App;
        }
        console.error('[Firebase Admin Final Init Error]:', error);
        throw error;
    }
}

export function getAdminDb(): admin.firestore.Firestore {
    // 런타임 체크 (서버사이드 전용)
    if (typeof window !== 'undefined') {
        throw new Error('[Firebase Admin] Cannot be used in browser environments.');
    }

    if (!cachedDb) {
        const app = initAdmin();
        // 루트 패키지에서 firestore(app)을 호출하여 서브패키지 로딩 문제를 회피합니다.
        cachedDb = admin.firestore(app);
    }
    return cachedDb;
}

// 하위 호환성 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
