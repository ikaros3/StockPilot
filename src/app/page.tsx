"use client";

import { DashboardLayout } from "@/components/layout";
import { PortfolioSummaryCard } from "@/components/cards";
import { HoldingsTable, StockDetailPanel } from "@/components/holdings";
import type { PerformanceGrade, PerformanceStatus, Holding, Portfolio } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

// localStorage 키
const SELECTED_PORTFOLIO_KEY = "stockpilot_selected_portfolio";

/**
 * 수익률에 따른 상태 결정
 */
function getPerformanceStatus(profitRate: number): PerformanceStatus {
  if (profitRate > 5) return "bullish";
  if (profitRate < -5) return "bearish";
  return "neutral";
}

/**
 * 전체 수익률에 따른 등급 결정
 */
function getPerformanceGrade(profitRate: number): PerformanceGrade {
  if (profitRate >= 20) return "excellent";
  if (profitRate >= 10) return "good";
  if (profitRate >= 0) return "average";
  if (profitRate >= -10) return "warning";
  return "poor";
}

interface HoldingWithPrice {
  id: string;
  stockCode: string;
  stockName: string;
  purchasePrice: number;
  quantity: number;
  currentPrice: number | null;      // API 실패 시 null
  evaluationAmount: number | null;  // API 실패 시 null
  profit: number | null;            // API 실패 시 null
  profitRate: number | null;        // API 실패 시 null
  performanceStatus: PerformanceStatus;
  priceChange: number | null;       // 전일 대비 가격 변동
  priceChangeRate: number | null;   // 전일 대비 등락률 (%)
  isApiSuccess: boolean;            // API 호출 성공 여부
}

interface PortfolioData {
  holdings: HoldingWithPrice[];
  portfolioSummary: {
    totalInvestment: number;
    currentValue: number;
    totalProfit: number;
    profitRate: number;
    holdingCount: number;
    performanceGrade: PerformanceGrade;
  };
  storageType: "emulator" | "firebase" | "localStorage";
}

export default function Home() {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();

  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<{ code: string; name: string; purchasePrice: number } | null>(null);

  // Authentication check
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  // localStorage에서 저장된 선택값 복원
  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_PORTFOLIO_KEY);
    if (saved) {
      setSelectedPortfolio(saved);
    }
  }, []);

  // 선택값 변경 시 localStorage에 저장
  const handlePortfolioChange = useCallback((value: string) => {
    setSelectedPortfolio(value);
    localStorage.setItem(SELECTED_PORTFOLIO_KEY, value);
  }, []);

  // 데이터 로드
  useEffect(() => {
    async function loadPortfolioData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // 클라이언트에서 동적으로 서비스 로드
        const {
          getUserPortfolios,
          getPortfolioHoldings,
          getStorageType
        } = await import("@/services/portfolio");

        const storageType = getStorageType();

        // 포트폴리오 목록 조회
        const portfolioList = await getUserPortfolios(user.uid);
        setPortfolios(portfolioList);

        // 포트폴리오가 없으면 빈 상태 표시
        if (portfolioList.length === 0) {
          setData({
            holdings: [],
            portfolioSummary: {
              totalInvestment: 0,
              currentValue: 0,
              totalProfit: 0,
              profitRate: 0,
              holdingCount: 0,
              performanceGrade: "average",
            },
            storageType,
          });
          setLoading(false);
          return;
        }

        // 선택에 따라 보유 종목 조회
        let holdingsList: Holding[] = [];

        if (selectedPortfolio === "all") {
          // 모든 포트폴리오의 보유 종목 합산
          const allHoldingsPromises = portfolioList.map(p => getPortfolioHoldings(p.id));
          const allHoldingsArrays = await Promise.all(allHoldingsPromises);
          holdingsList = allHoldingsArrays.flat();
        } else {
          // 선택된 포트폴리오만
          // 선택된 포트폴리오가 존재하는지 확인
          const portfolioExists = portfolioList.some(p => p.id === selectedPortfolio);
          if (portfolioExists) {
            holdingsList = await getPortfolioHoldings(selectedPortfolio);
          } else {
            // 선택된 포트폴리오가 없으면 전체로 전환
            handlePortfolioChange("all");
            const allHoldingsPromises = portfolioList.map(p => getPortfolioHoldings(p.id));
            const allHoldingsArrays = await Promise.all(allHoldingsPromises);
            holdingsList = allHoldingsArrays.flat();
          }
        }

        if (holdingsList.length === 0) {
          setData({
            holdings: [],
            portfolioSummary: {
              totalInvestment: 0,
              currentValue: 0,
              totalProfit: 0,
              profitRate: 0,
              holdingCount: 0,
              performanceGrade: "average",
            },
            storageType,
          });
          setLoading(false);
          return;
        }

        // 실제 현재가 조회 (전역 API 큐를 통해 Rate Limit 관리)
        const { apiQueue } = await import("@/services/api-queue");

        // 모든 종목 코드 추출
        const stockCodes = holdingsList.map((h: Holding) => h.stockCode);

        // 전역 큐를 통해 배치 처리 (자동으로 Rate Limit 관리)
        const priceMap = await apiQueue.fetchPrices(stockCodes);

        // 결과 매핑
        const holdingsWithPrice: HoldingWithPrice[] = holdingsList.map((holding: Holding) => {
          const priceData = priceMap.get(holding.stockCode);

          if (priceData) {
            const currentPrice = priceData.currentPrice;
            const evaluationAmount = currentPrice * holding.quantity;
            const investmentAmount = holding.purchasePrice * holding.quantity;
            const profit = evaluationAmount - investmentAmount;
            const profitRate = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;

            return {
              id: holding.id,
              stockCode: holding.stockCode,
              stockName: holding.stockName,
              purchasePrice: holding.purchasePrice,
              quantity: holding.quantity,
              currentPrice,
              evaluationAmount,
              profit,
              profitRate: Math.round(profitRate * 100) / 100,
              performanceStatus: getPerformanceStatus(profitRate),
              priceChange: priceData.changePrice,
              priceChangeRate: priceData.changeRate,
              isApiSuccess: true,
            };
          } else {
            console.error(`[Dashboard] ${holding.stockCode} 가격 조회 실패`);

            return {
              id: holding.id,
              stockCode: holding.stockCode,
              stockName: holding.stockName,
              purchasePrice: holding.purchasePrice,
              quantity: holding.quantity,
              currentPrice: null,
              evaluationAmount: null,
              profit: null,
              profitRate: null,
              performanceStatus: "neutral" as PerformanceStatus,
              priceChange: null,
              priceChangeRate: null,
              isApiSuccess: false,
            };
          }
        });

        // 포트폴리오 요약 계산 (API 성공한 종목만 합산)
        const successfulHoldings = holdingsWithPrice.filter(h => h.isApiSuccess);
        const totalInvestment = holdingsWithPrice.reduce(
          (sum, h) => sum + h.purchasePrice * h.quantity,
          0
        );
        const currentValue = successfulHoldings.reduce(
          (sum, h) => sum + (h.evaluationAmount ?? 0),
          0
        );
        const totalProfit = currentValue - totalInvestment;
        const profitRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

        setData({
          holdings: holdingsWithPrice,
          portfolioSummary: {
            totalInvestment,
            currentValue,
            totalProfit,
            profitRate: Math.round(profitRate * 100) / 100,
            holdingCount: holdingsWithPrice.length,
            performanceGrade: getPerformanceGrade(profitRate),
          },
          storageType,
        });
      } catch (err) {
        console.error("[Dashboard] 포트폴리오 로드 실패:", err);
        setError("포트폴리오를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthLoading && user) {
      loadPortfolioData();
    }
  }, [selectedPortfolio, handlePortfolioChange, user, isAuthLoading]);

  // 로딩 상태 (Auth or Data)
  if (isAuthLoading || (loading && !data)) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-40 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 로그인 안된 경우 (리다이렉트 되지만 깜빡임 방지용)
  if (!user) {
    return null;
  }

  // 오류 상태
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">내 자산</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 포트폴리오 선택 드롭다운
  const PortfolioSelector = () => (
    <Select value={selectedPortfolio} onValueChange={handlePortfolioChange}>
      <SelectTrigger className="w-[280px]">
        <Briefcase className="h-4 w-4 mr-2" />
        <SelectValue placeholder="포트폴리오 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">📂 전체 포트폴리오</SelectItem>
        {portfolios.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // 데이터 없음
  if (!data || data.holdings.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedPortfolio === "all" ? "내 자산" : portfolios.find(p => p.id === selectedPortfolio)?.name || "포트폴리오"}
              </h1>
              <p className="text-muted-foreground">
                {selectedPortfolio === "all" ? "전체 포트폴리오 현황을 한눈에 확인하세요." : "포트폴리오 현황"}
              </p>
            </div>
            {portfolios.length > 0 && <PortfolioSelector />}
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">보유 종목이 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">
              종목을 추가하여 포트폴리오를 구성해 보세요.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 제목 및 포트폴리오 선택 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedPortfolio === "all" ? "내 자산" : portfolios.find(p => p.id === selectedPortfolio)?.name || "포트폴리오"}
            </h1>
            <p className="text-muted-foreground">
              {selectedPortfolio === "all"
                ? "전체 포트폴리오 현황을 한눈에 확인하세요."
                : "포트폴리오 현황"
              }
              <span className="ml-2 text-xs text-green-500">● 실시간</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({data.storageType === "emulator" ? "Emulator" : data.storageType === "firebase" ? "Firebase" : "로컬"} 저장)
              </span>
            </p>
          </div>
          <PortfolioSelector />
        </div>

        {/* 포트폴리오 요약 */}
        <PortfolioSummaryCard {...data.portfolioSummary} />

        {/* 보유 종목 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            보유 종목
            {selectedPortfolio === "all" && portfolios.length > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({portfolios.length}개 포트폴리오 합산)
              </span>
            )}
          </h2>
          <HoldingsTable
            holdings={data.holdings}
            totalInvestment={data.portfolioSummary.totalInvestment}
            selectedStockCode={selectedStock?.code}
            onRowClick={(holding) => {
              if (selectedStock?.code === holding.stockCode) {
                setSelectedStock(null);
              } else {
                setSelectedStock({
                  code: holding.stockCode,
                  name: holding.stockName,
                  purchasePrice: holding.purchasePrice // 매수가 저장
                });
              }
            }}
          />
          {/* 선택된 종목 시황 정보 */}
          {selectedStock && (
            <StockDetailPanel
              stockCode={selectedStock.code}
              stockName={selectedStock.name}
              purchasePrice={selectedStock.purchasePrice} // 매수가 전달
              onClose={() => setSelectedStock(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
