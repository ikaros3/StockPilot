import useSWR, { mutate } from "swr";
import {
    getPortfolio,
    getPortfolioHoldings,
    updatePortfolio as updatePortfolioService,
    deletePortfolio as deletePortfolioService,
    addHolding as addHoldingService,
    updateHolding as updateHoldingService,
    deleteHolding as deleteHoldingService
} from "@/services/portfolio";
import type { Portfolio, Holding, CreateHoldingInput } from "@/types";

export function usePortfolio(portfolioId: string | null) {
    // 포트폴리오 정보 조회
    const {
        data: portfolio,
        error: portfolioError,
        isLoading: isPortfolioLoading,
        mutate: mutatePortfolio
    } = useSWR<Portfolio | null>(
        portfolioId ? `portfolio/${portfolioId}` : null,
        () => portfolioId ? getPortfolio(portfolioId) : null,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    // 보유 종목 목록 조회
    const {
        data: holdings = [],
        error: holdingsError,
        isLoading: isHoldingsLoading,
        mutate: mutateHoldings
    } = useSWR<Holding[]>(
        portfolioId ? `portfolio/${portfolioId}/holdings` : null,
        () => portfolioId ? getPortfolioHoldings(portfolioId) : [],
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );


    // 포트폴리오 수정
    const updatePortfolio = async (updates: Partial<Pick<Portfolio, "name" | "description">>) => {
        if (!portfolioId) return;
        await updatePortfolioService(portfolioId, updates);
        mutatePortfolio();
    };

    // 포트폴리오 삭제
    const deletePortfolio = async () => {
        if (!portfolioId) return;
        await deletePortfolioService(portfolioId);
    };

    // 보유 종목 추가
    const addHolding = async (input: Omit<CreateHoldingInput, "portfolioId">) => {
        if (!portfolioId) return;
        await addHoldingService({ ...input, portfolioId });
        mutateHoldings();
    };

    // 보유 종목 수정
    const updateHolding = async (holdingId: string, updates: Partial<Pick<Holding, "purchasePrice" | "quantity">>) => {
        await updateHoldingService(holdingId, updates);
        mutateHoldings();
    };

    // 보유 종목 삭제
    const deleteHolding = async (holdingId: string) => {
        await deleteHoldingService(holdingId);
        mutateHoldings();
    };

    // 전체 리로드
    const reloadAll = () => {
        mutatePortfolio();
        mutateHoldings();
    };

    // 디버깅 로그
    // console.log(`[usePortfolio] ID: ${portfolioId}, Loading: ${isPortfolioLoading}, Error: ${!!portfolioError}`);
    if (portfolioError) console.error("[usePortfolio] Error:", portfolioError);

    return {
        portfolio,
        holdings,
        isLoading: isPortfolioLoading || isHoldingsLoading,
        isError: portfolioError || holdingsError,
        updatePortfolio,
        deletePortfolio,
        addHolding,
        updateHolding,
        deleteHolding,
        reloadAll
    };
}
