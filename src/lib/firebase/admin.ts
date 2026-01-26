/**
 * Firebase Admin SDK 초기화
 * 
 * Turbopack / Cloud Run 환경 호환성을 위해 동적 import 사용
 * - createRequire 방식은 모듈 경로 맹글링으로 인해 배포 환경에서 실패
 * - 동적 import는 런타임에 모듈을 로드하므로 번들러 간섭 없음
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// 싱글톤 캐시
let cachedApp: any = null;
let cachedDb: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Firebase Admin App 초기화 (Lazy Singleton)
 * 동적 import를 사용하여 Turbopack 호환성 확보
 */
async function initAdmin(): Promise<any> {
    if (cachedApp) return cachedApp;

    // 동시 초기화 방지
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            // 동적 import 사용 (Turbopack/Webpack 번들링 우회)
            const firebaseAdmin = await import('firebase-admin/app');
            const { initializeApp, getApps, cert, getApp } = firebaseAdmin;

            if (!getApps().length) {
                if (FIREBASE_SERVICE_ACCOUNT) {
                    try {
                        const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
                        const pId = serviceAccount.project_id || PROJECT_ID;
                        cachedApp = initializeApp({
                            credential: cert(serviceAccount),
                            projectId: pId
                        });
                        console.log('[Firebase Admin] 서비스 계정으로 초기화 완료');
                    } catch (parseError) {
                        console.error('[Firebase Admin] 서비스 계정 파싱 오류:', parseError);
                        // Fallback: Application Default Credentials
                        if (PROJECT_ID) {
                            cachedApp = initializeApp({ projectId: PROJECT_ID });
                        } else {
                            cachedApp = initializeApp();
                        }
                    }
                } else {
                    // Cloud Run / Local: Application Default Credentials 사용
                    if (PROJECT_ID) {
                        cachedApp = initializeApp({ projectId: PROJECT_ID });
                    } else {
                        cachedApp = initializeApp();
                    }
                    console.log('[Firebase Admin] ADC로 초기화 완료');
                }
            } else {
                cachedApp = getApp();
            }

            return cachedApp;
        } catch (error) {
            console.error('[Firebase Admin] 초기화 실패:', error);
            initPromise = null; // 재시도 허용
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Firestore 인스턴스 획득 (Lazy 초기화)
 */
export async function getAdminDb(): Promise<any> {
    if (cachedDb) return cachedDb;

    try {
        const adminApp = await initAdmin();
        const firestoreModule = await import('firebase-admin/firestore');
        cachedDb = firestoreModule.getFirestore(adminApp);
        return cachedDb;
    } catch (error) {
        console.error('[Firebase Admin] Firestore 획득 실패:', error);
        throw error;
    }
}

/**
 * Firestore 연결 상태 확인 (선택적 사용)
 */
export async function isFirestoreAvailable(): Promise<boolean> {
    try {
        const db = await getAdminDb();
        // 간단한 연결 테스트
        await db.collection('system_metadata').limit(1).get();
        return true;
    } catch {
        return false;
    }
}

// 하위 호환성을 위한 동기 래퍼 (사용 시 주의 - 내부적으로 비동기)
// 참고: 이 방식은 초기화가 완료된 후에만 안전하게 동작합니다.
export const adminDb = {
    collection: (path: string) => {
        if (!cachedDb) {
            console.warn('[Firebase Admin] adminDb.collection 호출 시 DB가 아직 초기화되지 않았습니다. getAdminDb()를 사용하세요.');
            // 빈 proxy 반환 (에러 방지)
            return {
                doc: () => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async () => { }
                })
            };
        }
        return cachedDb.collection(path);
    },
} as any;
