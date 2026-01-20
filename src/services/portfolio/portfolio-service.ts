/**
 * 포트폴리오 서비스
 * 
 * Firebase Firestore를 사용한 포트폴리오 CRUD 작업
 * Firebase 미설정 시 LocalStorage 폴백 지원
 */

import {
    portfoliosCollection,
    holdingsCollection,
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
    where,
    orderBy,
    Timestamp,
} from "@/lib/firebase/firestore";
import { canUseFirebase, getStorageModeLabel } from "@/lib/firebase/config";
import type { Portfolio, Holding, CreatePortfolioInput, CreateHoldingInput } from "@/types";

// ============================================
// Firebase 설정 확인
// ============================================

// Firebase 또는 Emulator 사용 가능 여부 확인
const isFirebaseConfigured = (): boolean => {
    return canUseFirebase;
};

// ============================================
// LocalStorage 폴백 (Firebase 미설정 시)
// ============================================

const LOCAL_STORAGE_KEY = "stockpilot_portfolio";

interface LocalPortfolioData {
    portfolios: Portfolio[];
    holdings: Holding[];
}

const getLocalData = (): LocalPortfolioData => {
    if (typeof window === "undefined") {
        return { portfolios: [], holdings: [] };
    }
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : { portfolios: [], holdings: [] };
    } catch {
        return { portfolios: [], holdings: [] };
    }
};

const saveLocalData = (data: LocalPortfolioData): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// ============================================
// 포트폴리오 CRUD
// ============================================

/**
 * 포트폴리오 생성
 */
export async function createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
    if (isFirebaseConfigured()) {
        const docRef = await createDocument(portfoliosCollection, {
            userId: input.userId,
            name: input.name,
            description: input.description || "",
        });

        return {
            id: docRef.id,
            userId: input.userId,
            name: input.name,
            description: input.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const newPortfolio: Portfolio = {
        id: `local_${Date.now()}`,
        userId: input.userId,
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    data.portfolios.push(newPortfolio);
    saveLocalData(data);
    return newPortfolio;
}

/**
 * 포트폴리오 조회
 */
export async function getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    if (isFirebaseConfigured()) {
        const data = await getDocument<any>("portfolios", portfolioId);
        if (!data) return null;

        return {
            ...data,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
        } as Portfolio;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const portfolio = data.portfolios.find((p) => p.id === portfolioId) || null;
    if (portfolio) {
        // LocalStorage의 string 날짜를 Date 객체로 변환
        return {
            ...portfolio,
            createdAt: new Date(portfolio.createdAt),
            updatedAt: new Date(portfolio.updatedAt),
        };
    }
    return null;
}

/**
 * 사용자의 모든 포트폴리오 조회
 */
export async function getUserPortfolios(userId: string): Promise<Portfolio[]> {
    if (isFirebaseConfigured()) {
        const docs = await queryDocuments<any>(
            portfoliosCollection,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        return docs.map((doc) => ({
            ...doc,
            createdAt: safeToDate(doc.createdAt),
            updatedAt: safeToDate(doc.updatedAt),
        })) as Portfolio[];
    }

    // LocalStorage 폴백
    const data = getLocalData();
    return data.portfolios
        .filter((p) => p.userId === userId)
        .map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
        }));
}

/**
 * 포트폴리오 업데이트
 */
export async function updatePortfolio(
    portfolioId: string,
    updates: Partial<Pick<Portfolio, "name" | "description">>
): Promise<void> {
    if (isFirebaseConfigured()) {
        await updateDocument("portfolios", portfolioId, updates);
        return;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const index = data.portfolios.findIndex((p) => p.id === portfolioId);
    if (index !== -1) {
        data.portfolios[index] = {
            ...data.portfolios[index],
            ...updates,
            updatedAt: new Date(),
        };
        saveLocalData(data);
    }
}

/**
 * 포트폴리오 삭제
 */
export async function deletePortfolio(portfolioId: string): Promise<void> {
    if (isFirebaseConfigured()) {
        // 포트폴리오의 모든 보유 종목도 삭제
        const holdings = await getPortfolioHoldings(portfolioId);
        for (const holding of holdings) {
            await deleteDocument("holdings", holding.id);
        }
        await deleteDocument("portfolios", portfolioId);
        return;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    data.portfolios = data.portfolios.filter((p) => p.id !== portfolioId);
    data.holdings = data.holdings.filter((h) => h.portfolioId !== portfolioId);
    saveLocalData(data);
}

// ============================================
// 보유 종목 CRUD
// ============================================

/**
 * 보유 종목 추가
 */
export async function addHolding(input: CreateHoldingInput): Promise<Holding> {
    if (isFirebaseConfigured()) {
        const docRef = await createDocument(holdingsCollection, {
            portfolioId: input.portfolioId,
            stockCode: input.stockCode,
            stockName: input.stockName,
            purchasePrice: input.purchasePrice,
            quantity: input.quantity,
            purchaseDate: Timestamp.fromDate(input.purchaseDate),
            additionalPurchases: [],
        });

        return {
            id: docRef.id,
            portfolioId: input.portfolioId,
            stockCode: input.stockCode,
            stockName: input.stockName,
            purchasePrice: input.purchasePrice,
            quantity: input.quantity,
            purchaseDate: input.purchaseDate,
            additionalPurchases: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const newHolding: Holding = {
        id: `local_${Date.now()}`,
        portfolioId: input.portfolioId,
        stockCode: input.stockCode,
        stockName: input.stockName,
        purchasePrice: input.purchasePrice,
        quantity: input.quantity,
        purchaseDate: input.purchaseDate,
        additionalPurchases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    data.holdings.push(newHolding);
    saveLocalData(data);
    return newHolding;
}

/**
 * 보유 종목 조회
 */
export async function getHolding(holdingId: string): Promise<Holding | null> {
    if (isFirebaseConfigured()) {
        return getDocument<Holding>("holdings", holdingId);
    }

    // LocalStorage 폴백
    const data = getLocalData();
    return data.holdings.find((h) => h.id === holdingId) || null;
}

/**
 * 포트폴리오의 모든 보유 종목 조회
 */
export async function getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
    if (isFirebaseConfigured()) {
        const docs = await queryDocuments<any>(
            holdingsCollection,
            where("portfolioId", "==", portfolioId),
            orderBy("createdAt", "desc")
        );
        return docs.map((doc) => ({
            ...doc,
            purchaseDate: safeToDate(doc.purchaseDate),
            createdAt: safeToDate(doc.createdAt),
            updatedAt: safeToDate(doc.updatedAt),
            additionalPurchases: (doc.additionalPurchases || []).map((ap: any) => ({
                ...ap,
                date: safeToDate(ap.date),
            })),
        })) as Holding[];
    }

    // LocalStorage 폴백
    const data = getLocalData();
    return data.holdings
        .filter((h) => h.portfolioId === portfolioId)
        .map(h => ({
            ...h,
            purchaseDate: new Date(h.purchaseDate),
            createdAt: new Date(h.createdAt),
            updatedAt: new Date(h.updatedAt),
            additionalPurchases: h.additionalPurchases.map(ap => ({
                ...ap,
                date: new Date(ap.date)
            }))
        }));
}

/**
 * 보유 종목 업데이트
 */
export async function updateHolding(
    holdingId: string,
    updates: Partial<Pick<Holding, "purchasePrice" | "quantity">>
): Promise<void> {
    if (isFirebaseConfigured()) {
        await updateDocument("holdings", holdingId, updates);
        return;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const index = data.holdings.findIndex((h) => h.id === holdingId);
    if (index !== -1) {
        data.holdings[index] = {
            ...data.holdings[index],
            ...updates,
            updatedAt: new Date(),
        };
        saveLocalData(data);
    }
}

/**
 * 보유 종목 삭제
 */
export async function deleteHolding(holdingId: string): Promise<void> {
    if (isFirebaseConfigured()) {
        await deleteDocument("holdings", holdingId);
        return;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    data.holdings = data.holdings.filter((h) => h.id !== holdingId);
    saveLocalData(data);
}

/**
 * 추가 매수 기록 추가
 */
export async function addAdditionalPurchase(
    holdingId: string,
    purchasePrice: number,
    quantity: number,
    date: Date = new Date()
): Promise<void> {
    const holding = await getHolding(holdingId);
    if (!holding) {
        throw new Error("보유 종목을 찾을 수 없습니다.");
    }

    const newPurchase = {
        price: purchasePrice,
        quantity,
        date,
    };

    // 평균 매수가 재계산
    const totalQuantity = holding.quantity + quantity;
    const totalCost =
        holding.purchasePrice * holding.quantity + purchasePrice * quantity;
    const newAveragePrice = totalCost / totalQuantity;

    if (isFirebaseConfigured()) {
        // Firestore 저장용: 모든 Date를 Timestamp로 변환
        const firestorePurchases = [
            ...(holding.additionalPurchases || []).map(p => ({
                ...p,
                date: Timestamp.fromDate(p.date)
            })),
            {
                ...newPurchase,
                date: Timestamp.fromDate(newPurchase.date)
            }
        ];

        await updateDocument("holdings", holdingId, {
            additionalPurchases: firestorePurchases,
            purchasePrice: newAveragePrice,
            quantity: totalQuantity,
        });
        return;
    }

    // LocalStorage 폴백
    const data = getLocalData();
    const index = data.holdings.findIndex((h) => h.id === holdingId);
    if (index !== -1) {
        // LocalStorage에는 Date 객체(JSON 변환 시 string)로 저장
        const updatedPurchases = [
            ...(holding.additionalPurchases || []),
            newPurchase
        ];

        data.holdings[index] = {
            ...data.holdings[index],
            additionalPurchases: updatedPurchases,
            purchasePrice: newAveragePrice,
            quantity: totalQuantity,
            updatedAt: new Date(),
        };
        saveLocalData(data);
    }
}

// ============================================
// 유틸리티 함수
// ============================================

const safeToDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === "function") {
        return val.toDate();
    }
    if (val instanceof Date) {
        return val;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        return d;
    }
    return new Date();
};

/**
 * 기본 포트폴리오 초기화 (데모 데이터)
 */
export async function initializeDefaultPortfolio(userId: string): Promise<Portfolio> {
    // 기존 포트폴리오가 있는지 확인
    const existingPortfolios = await getUserPortfolios(userId);
    if (existingPortfolios.length > 0) {
        return existingPortfolios[0];
    }

    // 기본 포트폴리오 생성
    const portfolio = await createPortfolio({
        userId,
        name: "메인 포트폴리오",
        description: "기본 투자 포트폴리오",
    });

    // 데모 보유 종목 추가
    const demoHoldings = [
        { stockCode: "005930", stockName: "삼성전자", purchasePrice: 65000, quantity: 100 },
        { stockCode: "000660", stockName: "SK하이닉스", purchasePrice: 120000, quantity: 50 },
        { stockCode: "035720", stockName: "카카오", purchasePrice: 48000, quantity: 50 },
        { stockCode: "005380", stockName: "현대차", purchasePrice: 200000, quantity: 20 },
    ];

    for (const demo of demoHoldings) {
        await addHolding({
            portfolioId: portfolio.id,
            ...demo,
            purchaseDate: new Date(),
        });
    }

    return portfolio;
}

/**
 * 저장소 모드 확인 (emulator / firebase / localStorage)
 */
export function getStorageType(): "emulator" | "firebase" | "localStorage" {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") return "emulator";
    return canUseFirebase ? "firebase" : "localStorage";
}

/**
 * 저장소 모드 라벨 (UI 표시용)
 */
export { getStorageModeLabel };
