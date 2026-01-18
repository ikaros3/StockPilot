import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Portfolio, Holding, User } from "@/types";

/**
 * 포트폴리오 상태 인터페이스
 */
interface PortfolioState {
    // 상태
    portfolios: Portfolio[];
    holdings: Map<string, Holding[]>; // portfolioId -> holdings
    activePortfolioId: string | null;
    isLoading: boolean;
    error: string | null;

    // 액션
    setPortfolios: (portfolios: Portfolio[]) => void;
    addPortfolio: (portfolio: Portfolio) => void;
    updatePortfolio: (id: string, data: Partial<Portfolio>) => void;
    deletePortfolio: (id: string) => void;
    setActivePortfolio: (id: string | null) => void;

    setHoldings: (portfolioId: string, holdings: Holding[]) => void;
    addHolding: (portfolioId: string, holding: Holding) => void;
    updateHolding: (portfolioId: string, holdingId: string, data: Partial<Holding>) => void;
    deleteHolding: (portfolioId: string, holdingId: string) => void;

    getActivePortfolio: () => Portfolio | undefined;
    getActiveHoldings: () => Holding[];

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

/**
 * 포트폴리오 스토어
 */
export const usePortfolioStore = create<PortfolioState>()(
    persist(
        (set, get) => ({
            // 초기 상태
            portfolios: [],
            holdings: new Map(),
            activePortfolioId: null,
            isLoading: false,
            error: null,

            // 포트폴리오 액션
            setPortfolios: (portfolios) => set({ portfolios }),

            addPortfolio: (portfolio) => set((state) => ({
                portfolios: [...state.portfolios, portfolio],
            })),

            updatePortfolio: (id, data) => set((state) => ({
                portfolios: state.portfolios.map((p) =>
                    p.id === id ? { ...p, ...data } : p
                ),
            })),

            deletePortfolio: (id) => set((state) => ({
                portfolios: state.portfolios.filter((p) => p.id !== id),
                activePortfolioId: state.activePortfolioId === id ? null : state.activePortfolioId,
            })),

            setActivePortfolio: (id) => set({ activePortfolioId: id }),

            // 보유 종목 액션
            setHoldings: (portfolioId, holdings) => set((state) => {
                const newHoldings = new Map(state.holdings);
                newHoldings.set(portfolioId, holdings);
                return { holdings: newHoldings };
            }),

            addHolding: (portfolioId, holding) => set((state) => {
                const newHoldings = new Map(state.holdings);
                const current = newHoldings.get(portfolioId) || [];
                newHoldings.set(portfolioId, [...current, holding]);
                return { holdings: newHoldings };
            }),

            updateHolding: (portfolioId, holdingId, data) => set((state) => {
                const newHoldings = new Map(state.holdings);
                const current = newHoldings.get(portfolioId) || [];
                newHoldings.set(
                    portfolioId,
                    current.map((h) => (h.id === holdingId ? { ...h, ...data } : h))
                );
                return { holdings: newHoldings };
            }),

            deleteHolding: (portfolioId, holdingId) => set((state) => {
                const newHoldings = new Map(state.holdings);
                const current = newHoldings.get(portfolioId) || [];
                newHoldings.set(
                    portfolioId,
                    current.filter((h) => h.id !== holdingId)
                );
                return { holdings: newHoldings };
            }),

            // 게터
            getActivePortfolio: () => {
                const { portfolios, activePortfolioId } = get();
                return portfolios.find((p) => p.id === activePortfolioId);
            },

            getActiveHoldings: () => {
                const { holdings, activePortfolioId } = get();
                if (!activePortfolioId) return [];
                return holdings.get(activePortfolioId) || [];
            },

            // 유틸리티
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            reset: () => set({
                portfolios: [],
                holdings: new Map(),
                activePortfolioId: null,
                isLoading: false,
                error: null,
            }),
        }),
        {
            name: "stockpilot-portfolio",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                portfolios: state.portfolios,
                activePortfolioId: state.activePortfolioId,
                // holdings는 Map이라 별도 처리 필요
            }),
        }
    )
);
