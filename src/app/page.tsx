import { DashboardLayout } from "@/components/layout";
import { PortfolioSummaryCard, StockCard } from "@/components/cards";
import type { PerformanceGrade, PerformanceStatus } from "@/types";

// 임시 데이터
const portfolioSummary = {
  totalInvestment: 10000000,
  currentValue: 12500000,
  totalProfit: 2500000,
  profitRate: 25.0,
  holdingCount: 5,
  performanceGrade: "excellent" as PerformanceGrade,
};

const holdings = [
  {
    id: "1",
    stockCode: "005930",
    stockName: "삼성전자",
    currentPrice: 78000,
    purchasePrice: 65000,
    quantity: 100,
    evaluationAmount: 7800000,
    profit: 1300000,
    profitRate: 20.0,
    performanceStatus: "bullish" as PerformanceStatus,
  },
  {
    id: "2",
    stockCode: "122630",
    stockName: "KODEX 레버리지",
    currentPrice: 18500,
    purchasePrice: 17000,
    quantity: 200,
    evaluationAmount: 3700000,
    profit: 300000,
    profitRate: 8.82,
    performanceStatus: "bullish" as PerformanceStatus,
  },
  {
    id: "3",
    stockCode: "035720",
    stockName: "카카오",
    currentPrice: 42000,
    purchasePrice: 48000,
    quantity: 50,
    evaluationAmount: 2100000,
    profit: -300000,
    profitRate: -12.5,
    performanceStatus: "bearish" as PerformanceStatus,
  },
  {
    id: "4",
    stockCode: "066570",
    stockName: "LG전자",
    currentPrice: 95000,
    purchasePrice: 95000,
    quantity: 30,
    evaluationAmount: 2850000,
    profit: 0,
    profitRate: 0,
    performanceStatus: "neutral" as PerformanceStatus,
  },
];

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            포트폴리오 현황을 한눈에 확인하세요.
          </p>
        </div>

        {/* 포트폴리오 요약 */}
        <PortfolioSummaryCard {...portfolioSummary} />

        {/* 보유 종목 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">보유 종목</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {holdings.map((holding) => (
              <StockCard key={holding.id} {...holding} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
