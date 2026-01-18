import { Timestamp } from "firebase/firestore";

/**
 * 투자 성향
 */
export type InvestmentStyle = "aggressive" | "moderate" | "conservative";

/**
 * 투자 기간
 */
export type InvestmentHorizon = "short" | "medium" | "long";

/**
 * 사용자 정보
 */
export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;

    // 투자 설정
    investmentStyle: InvestmentStyle;
    investmentHorizon: InvestmentHorizon;
    targetReturn: number;  // 목표 수익률 (%)
    maxLoss: number;       // 허용 손실률 (%)

    // 타임스탬프
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * 사용자 생성 입력 데이터
 */
export interface CreateUserInput {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    investmentStyle?: InvestmentStyle;
    investmentHorizon?: InvestmentHorizon;
    targetReturn?: number;
    maxLoss?: number;
}

/**
 * 사용자 업데이트 입력 데이터
 */
export type UpdateUserInput = Partial<Omit<User, "uid" | "createdAt" | "updatedAt">>;
