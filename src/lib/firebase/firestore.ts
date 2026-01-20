import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    QueryConstraint,
    DocumentData,
    WithFieldValue,
    DocumentReference,
    CollectionReference,
} from "firebase/firestore";
import { getFirestoreDb, canUseFirebase } from "./config";

// ============================================
// 컬렉션 참조 (지연 생성)
// ============================================

/**
 * 컬렉션 참조를 안전하게 가져옵니다.
 * Firebase가 설정되지 않으면 오류를 발생시킵니다.
 */
function getCollectionRef(collectionName: string): CollectionReference {
    const db = getFirestoreDb();
    if (!db) {
        throw new Error(
            `[Firestore] Firebase가 설정되지 않았습니다. ${collectionName} 컬렉션에 접근할 수 없습니다.`
        );
    }
    return collection(db, collectionName);
}

// 컬렉션 참조 getter
export const portfoliosCollection = (() => {
    if (!canUseFirebase) {
        return null as unknown as CollectionReference;
    }
    return getCollectionRef("portfolios");
})();

export const holdingsCollection = (() => {
    if (!canUseFirebase) {
        return null as unknown as CollectionReference;
    }
    return getCollectionRef("holdings");
})();

export const usersCollection = (() => {
    if (!canUseFirebase) {
        return null as unknown as CollectionReference;
    }
    return getCollectionRef("users");
})();

export const analysisReportsCollection = (() => {
    if (!canUseFirebase) {
        return null as unknown as CollectionReference;
    }
    return getCollectionRef("analysisReports");
})();

export const alertsCollection = (() => {
    if (!canUseFirebase) {
        return null as unknown as CollectionReference;
    }
    return getCollectionRef("alerts");
})();

// ============================================
// 제네릭 CRUD 헬퍼 함수
// ============================================

/**
 * 문서 생성 (ID 자동 생성 또는 지정)
 */
export async function createDocument<T extends DocumentData>(
    collectionRef: CollectionReference,
    data: WithFieldValue<T>,
    customId?: string
): Promise<DocumentReference> {
    if (!collectionRef) {
        throw new Error("[Firestore] Firebase가 설정되지 않았습니다.");
    }

    const docRef = customId
        ? doc(collectionRef, customId)
        : doc(collectionRef);

    await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return docRef;
}

/**
 * 문서 읽기
 */
export async function getDocument<T>(
    collectionName: string,
    docId: string
): Promise<T | null> {
    const db = getFirestoreDb();
    if (!db) {
        throw new Error("[Firestore] Firebase가 설정되지 않았습니다.");
    }

    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
}

/**
 * 문서 업데이트
 */
export async function updateDocument<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: Partial<T>
): Promise<void> {
    const db = getFirestoreDb();
    if (!db) {
        throw new Error("[Firestore] Firebase가 설정되지 않았습니다.");
    }

    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * 문서 삭제
 */
export async function deleteDocument(
    collectionName: string,
    docId: string
): Promise<void> {
    const db = getFirestoreDb();
    if (!db) {
        throw new Error("[Firestore] Firebase가 설정되지 않았습니다.");
    }

    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
}

/**
 * 컬렉션 쿼리
 */
export async function queryDocuments<T>(
    collectionRef: CollectionReference,
    ...constraints: QueryConstraint[]
): Promise<T[]> {
    if (!collectionRef) {
        throw new Error("[Firestore] Firebase가 설정되지 않았습니다.");
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as T[];
}

/**
 * 실시간 문서 구독
 */
export function subscribeToDocument<T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void
): () => void {
    const db = getFirestoreDb();
    if (!db) {
        console.warn("[Firestore] Firebase가 설정되지 않았습니다. 구독을 건너뜁니다.");
        return () => { };
    }

    const docRef = doc(db, collectionName, docId);

    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
            callback(null);
        }
    });
}

/**
 * 실시간 컬렉션 쿼리 구독
 */
export function subscribeToQuery<T>(
    collectionRef: CollectionReference,
    constraints: QueryConstraint[],
    callback: (data: T[]) => void
): () => void {
    if (!collectionRef) {
        console.warn("[Firestore] Firebase가 설정되지 않았습니다. 구독을 건너뜁니다.");
        return () => { };
    }

    const q = query(collectionRef, ...constraints);

    return onSnapshot(q, (querySnapshot) => {
        const results = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as T[];
        callback(results);
    });
}

// ============================================
// 유틸리티
// ============================================

export { Timestamp, where, orderBy, limit };
