/**
 * Firestore REST API 클라이언트
 * 
 * firebase-admin 대신 Firestore REST API를 직접 호출하여
 * Turbopack 번들링 문제를 우회합니다.
 * 
 * - Cloud Run: 메타데이터 서버를 통해 자동 인증
 * - 로컬 에뮬레이터: 인증 없이 직접 연결
 * - 로컬 프로덕션 DB: 서비스 계정으로 인증
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// 에뮬레이터 설정 (환경변수로 감지)
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST; // 예: "127.0.0.1:8080"

// Access Token 캐시
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * 에뮬레이터 사용 여부 확인
 */
function isUsingEmulator(): boolean {
    return !!FIRESTORE_EMULATOR_HOST;
}

/**
 * Firestore Base URL 반환
 */
function getFirestoreBaseUrl(): string {
    if (isUsingEmulator()) {
        return `http://${FIRESTORE_EMULATOR_HOST}/v1`;
    }
    return 'https://firestore.googleapis.com/v1';
}

/**
 * Google Cloud Access Token 획득
 * 에뮬레이터 모드에서는 토큰 불필요
 */
async function getGoogleAccessToken(): Promise<string | null> {
    // 에뮬레이터 모드에서는 인증 불필요
    if (isUsingEmulator()) {
        return null;
    }

    const now = Date.now();

    // 캐시된 토큰이 유효하면 재사용
    if (cachedAccessToken && now < tokenExpiresAt - 60000) {
        return cachedAccessToken;
    }

    // 1. Cloud Run 메타데이터 서버에서 토큰 획득 시도
    try {
        const response = await fetch(
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            {
                headers: { 'Metadata-Flavor': 'Google' },
                cache: 'no-store'
            }
        );

        if (response.ok) {
            const data = await response.json();
            cachedAccessToken = data.access_token;
            tokenExpiresAt = now + (data.expires_in * 1000);
            console.log('[FirestoreREST] 메타데이터 서버에서 토큰 획득');
            return cachedAccessToken!;
        }
    } catch {
        // 메타데이터 서버 없음 (로컬 환경)
    }

    // 2. 로컬: 서비스 계정으로 JWT 생성
    if (FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
            const jwt = await createSignedJwt(serviceAccount);

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt
                }),
                cache: 'no-store'
            });

            if (tokenResponse.ok) {
                const data = await tokenResponse.json();
                cachedAccessToken = data.access_token;
                tokenExpiresAt = now + (data.expires_in * 1000);
                console.log('[FirestoreREST] 서비스 계정으로 토큰 획득');
                return cachedAccessToken!;
            }
        } catch (error) {
            console.error('[FirestoreREST] 서비스 계정 토큰 획득 실패:', error);
        }
    }

    throw new Error('Google Access Token을 획득할 수 없습니다');
}

/**
 * JWT 생성 (서비스 계정용)
 */
async function createSignedJwt(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/datastore'
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Node.js crypto로 서명
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');

    return `${unsignedToken}.${signature}`;
}

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// =============================================================================
// Firestore REST API Operations
// =============================================================================

interface FirestoreDocument {
    fields?: Record<string, any>;
}

/**
 * 요청 헤더 생성
 */
async function getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    const token = await getGoogleAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Firestore 문서 조회
 */
export async function getDocument(collection: string, docId: string): Promise<Record<string, any> | null> {
    if (!PROJECT_ID) {
        console.warn('[FirestoreREST] PROJECT_ID가 설정되지 않음');
        return null;
    }

    try {
        const baseUrl = getFirestoreBaseUrl();
        const url = `${baseUrl}/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
        const headers = await getHeaders();

        if (isUsingEmulator()) {
            console.log(`[FirestoreREST] 에뮬레이터 연결: ${url}`);
        }

        const response = await fetch(url, {
            headers,
            cache: 'no-store'
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            console.error(`[FirestoreREST] 문서 조회 실패: ${response.status}`);
            return null;
        }

        const doc: FirestoreDocument = await response.json();
        return parseFirestoreFields(doc.fields || {});
    } catch (error) {
        console.error('[FirestoreREST] 문서 조회 오류:', error);
        return null;
    }
}

/**
 * Firestore 문서 저장/업데이트
 */
export async function setDocument(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
    if (!PROJECT_ID) {
        console.warn('[FirestoreREST] PROJECT_ID가 설정되지 않음');
        return false;
    }

    try {
        const baseUrl = getFirestoreBaseUrl();
        const url = `${baseUrl}/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
        const headers = await getHeaders();

        if (isUsingEmulator()) {
            console.log(`[FirestoreREST] 에뮬레이터에 저장: ${url}`);
        }

        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                fields: toFirestoreFields(data)
            }),
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[FirestoreREST] 문서 저장 실패: ${response.status}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[FirestoreREST] 문서 저장 오류:', error);
        return false;
    }
}

// =============================================================================
// Firestore Value Converters
// =============================================================================

function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
        result[key] = parseFirestoreValue(value);
    }

    return result;
}

function parseFirestoreValue(value: any): any {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.timestampValue !== undefined) return new Date(value.timestampValue);
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue !== undefined) {
        return (value.arrayValue.values || []).map(parseFirestoreValue);
    }
    if (value.mapValue !== undefined) {
        return parseFirestoreFields(value.mapValue.fields || {});
    }
    return null;
}

function toFirestoreFields(data: Record<string, any>): Record<string, any> {
    const fields: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        fields[key] = toFirestoreValue(value);
    }

    return fields;
}

function toFirestoreValue(value: any): any {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    if (typeof value === 'object') {
        return { mapValue: { fields: toFirestoreFields(value) } };
    }
    return { nullValue: null };
}
