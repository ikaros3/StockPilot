"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { apiQueue } from "@/services/api-queue";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PriceData {
    stockCode?: string;
    stockName?: string;
    currentPrice: number;
    changePrice: number;
    changeRate: number;
    openPrice?: number;
    highPrice?: number;
    lowPrice?: number;
    volume?: number;
    tradingValue?: number;
    marketCap?: number;
    per?: number;
    pbr?: number;
    eps?: number;
    bps?: number;
    yearHighPrice?: number;
    yearLowPrice?: number;
}

/**
 * 종목 가격 데이터 훅 (apiQueue 사용)
 */
export function useStockPrice(stockCode: string) {
    const [price, setPrice] = useState<PriceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!stockCode) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsError(false);

        apiQueue.fetchPrice(stockCode)
            .then((data) => {
                if (data) {
                    setPrice(data as PriceData);
                } else {
                    setIsError(true);
                }
            })
            .catch(() => setIsError(true))
            .finally(() => setIsLoading(false));
    }, [stockCode]);

    const refresh = () => {
        apiQueue.invalidateCache(stockCode);
        setIsLoading(true);
        apiQueue.fetchPrice(stockCode)
            .then((data) => {
                if (data) setPrice(data as PriceData);
            })
            .finally(() => setIsLoading(false));
    };

    return {
        price,
        isLoading,
        isError,
        refresh,
    };
}

/**
 * 종목 전체 데이터 훅 (가격은 apiQueue 사용)
 */
export function useStockData(stockCode: string) {
    // 가격은 apiQueue를 통해 가져옴
    const { price, isLoading: priceLoading } = useStockPrice(stockCode);

    // 나머지 데이터는 /api/stock에서 가져옴 (가격 제외)
    const { data, error, isLoading: dataLoading, mutate } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=company` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        data: { ...data, price },
        price,
        company: data?.company,
        ratios: data?.ratios,
        analystReports: data?.analystReports,
        consensus: data?.consensus,
        isLoading: priceLoading || dataLoading,
        isError: error,
        refresh: mutate,
    };
}

/**
 * 일별 시세 훅 (apiQueue 사용)
 */
export function useDailyPrices(stockCode: string) {
    // 가격은 apiQueue를 통해 가져옴
    const { price, isLoading: priceLoading } = useStockPrice(stockCode);

    const { data, error, isLoading } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=daily` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        dailyPrices: data?.dailyPrices,
        price,
        isLoading: isLoading || priceLoading,
        isError: error,
    };
}

/**
 * 호가 데이터 훅
 */
export function useOrderBook(stockCode: string) {
    const { data, error, isLoading, mutate } = useSWR(
        stockCode ? `/api/kis/orderbook?symbol=${stockCode}` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        orderBook: data?.orderBook,
        isLoading,
        isError: error,
        refresh: mutate,
    };
}

/**
 * 애널리스트 데이터 훅
 */
export function useAnalystData(stockCode: string) {
    const { data, error, isLoading } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=analyst` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        reports: data?.analystReports,
        consensus: data?.consensus,
        isLoading,
        isError: error,
    };
}

/**
 * 재무 데이터 훅
 */
export function useFinancialData(stockCode: string) {
    const { data, error, isLoading } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=financial` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        financials: data?.financials,
        isLoading,
        isError: error,
    };
}

/**
 * 공시 데이터 훅
 */
export function useDisclosures(stockCode: string) {
    const { data, error, isLoading } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=disclosure` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        disclosures: data?.disclosures,
        isLoading,
        isError: error,
    };
}

/**
 * 뉴스 훅
 */
export function useNews(stockCode: string) {
    const { data, error, isLoading } = useSWR(
        stockCode ? `/api/stock?stockCode=${stockCode}&type=news` : null,
        fetcher,
        {
            refreshInterval: 0,
            revalidateOnFocus: false,
        }
    );

    return {
        news: data?.news,
        isLoading,
        isError: error,
    };
}
