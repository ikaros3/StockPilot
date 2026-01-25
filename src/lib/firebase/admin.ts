import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 초기화
 * Next.js 15/16 및 Firebase Hosting 'webframeworks' 환경에 맞춰 
 * 가장 표준적이고 안정적인 싱글톤 패턴을 사용합니다.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (typeof window === 'undefined') {
    if (!admin.apps.length) {
        try {
            // 1. 서비스 계정 키가 명시적으로 제공된 경우 (로컬/특수 배포)
            if (FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id || PROJECT_ID
                });
                console.log("[Firebase Admin] Initialized with Service Account");
            }
            // 2. 배포 환경(GCP/Firebase) - 기본 인프라 인증(ADC) 시스템 활용
            else {
                admin.initializeApp({
                    projectId: PROJECT_ID
                });
                console.log("[Firebase Admin] Initialized with Application Default Credentials");
            }
        } catch (error: any) {
            if (error.code !== 'app/duplicate-app') {
                console.error("[Firebase Admin] Initialization ERROR:", error);
            }
        }
    }
}

/**
 * Firestore DB 인스턴스 획득
 * 이제 next.config.ts의 복잡한 설정을 제거하여 프레임워크가 표준 방식으로 모듈을 로드합니다.
 */
export function getAdminDb(): admin.firestore.Firestore {
    return admin.firestore();
}

// 하위 호환성을 위해 유지
export const adminDb = {
    collection: (path: string) => getAdminDb().collection(path),
} as any;
