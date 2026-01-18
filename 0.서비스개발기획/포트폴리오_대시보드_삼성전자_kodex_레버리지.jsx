import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

// Single-file React component dashboard (TailwindCSS)
// - Tailwind should be available in the project
// - Recharts & Framer Motion should be installed
// - Replace `fetchRealtimeData()` with your real-time API integration

const sampleHoldings = [
  {
    id: "005930",
    name: "삼성전자",
    avgCost: 80920,
    qty: 50,
    // sample current price (replace with API value)
    currentPrice: 148900,
    sellTargets: [160000, 170000],
    buyTargets: [140000, 135000],
    stopLoss: 130000,
    recommendation:
      "중기 보유 권장. 목표가 도달 시 분할매도(160k / 170k). 조정 시 분할매수 권장.",
    miniSeries: [
      { t: "D-6", p: 135000 },
      { t: "D-5", p: 138000 },
      { t: "D-4", p: 142000 },
      { t: "D-3", p: 145000 },
      { t: "D-2", p: 147000 },
      { t: "D-1", p: 149000 },
      { t: "Now", p: 148900 }
    ]
  },
  {
    id: "122630",
    name: "KODEX 레버리지",
    avgCost: 26634,
    qty: 160,
    currentPrice: 64310,
    sellTargets: [70000],
    buyTargets: [60000, 55000],
    stopLoss: 54000,
    recommendation:
      "단기~중기 매매 권장. 고점에서는 분할매도, 조정 시 분할매수 권장. 레버리지 상품 특성상 변동성 관리 필요.",
    miniSeries: [
      { t: "D-6", p: 52000 },
      { t: "D-5", p: 56000 },
      { t: "D-4", p: 59000 },
      { t: "D-3", p: 61000 },
      { t: "D-2", p: 63000 },
      { t: "D-1", p: 64000 },
      { t: "Now", p: 64310 }
    ]
  }
];

function currency(n) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function PortfolioDashboard() {
  const [holdings, setHoldings] = useState(sampleHoldings);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // TODO: integrate your real-time API here
    // e.g. async function fetchRealtimeData() { ... }
    // fetchRealtimeData().then(data => setHoldings(data))

    // For demo the sample data stays the same and shows last updated timestamp
    const t = setInterval(() => setLastUpdated(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const portfolioSummary = holdings.reduce(
    (acc, h) => {
      const marketValue = h.currentPrice * h.qty;
      const costValue = h.avgCost * h.qty;
      acc.totalMarket += marketValue;
      acc.totalCost += costValue;
      return acc;
    },
    { totalMarket: 0, totalCost: 0 }
  );

  const totalPL = portfolioSummary.totalMarket - portfolioSummary.totalCost;
  const totalPLPercent = (totalPL / portfolioSummary.totalCost) * 100;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">포트폴리오 대시보드</h1>
            <p className="text-sm text-slate-500">보유 종목 요약 및 매매 권장사항</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">최근 업데이트</div>
            <div className="text-sm font-mono">{lastUpdated.toLocaleString()}</div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-2">포트폴리오 요약</h2>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-slate-500">총 평가금액</div>
                <div className="text-2xl font-bold">{currency(portfolioSummary.totalMarket)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">총 손익</div>
                <div className="text-2xl font-bold" style={{ color: totalPL >= 0 ? "#059669" : "#dc2626" }}>
                  {currency(totalPL)} ({totalPLPercent.toFixed(2)}%)
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">총 매입금액</div>
                <div className="text-lg">{currency(portfolioSummary.totalCost)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-2">빠른 액션</h2>
            <div className="flex flex-col gap-2">
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">시세 알림 설정</button>
              <button className="px-4 py-2 rounded-lg border">자동 분할매수/매도 전략 설정</button>
              <button className="px-4 py-2 rounded-lg border">애널리스트 리포트 불러오기</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          {holdings.map((h) => {
            const marketValue = h.currentPrice * h.qty;
            const costValue = h.avgCost * h.qty;
            const pl = marketValue - costValue;
            const plPercent = (pl / costValue) * 100;

            return (
              <motion.div
                key={h.id}
                className="bg-white p-4 rounded-2xl shadow flex flex-col md:flex-row gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{h.name} <span className="text-sm text-slate-400">({h.id})</span></h3>
                      <div className="text-sm text-slate-500">수량: {h.qty}주 • 매수가: {currency(h.avgCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500">현재가</div>
                      <div className="text-2xl font-bold">{currency(h.currentPrice)}</div>
                      <div className="text-sm" style={{ color: pl >= 0 ? "#059669" : "#dc2626" }}>
                        {pl >= 0 ? "+" : ""}{currency(pl)} ({plPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-slate-500">권장 매도 목표</div>
                      <div className="font-medium mt-1">
                        {h.sellTargets.map((s) => currency(s)).join(" / ")}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-slate-500">권장 추가매수</div>
                      <div className="font-medium mt-1">{h.buyTargets.map((b) => currency(b)).join(" / ")}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-slate-500">손절 기준</div>
                      <div className="font-medium mt-1">{currency(h.stopLoss)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button className="px-3 py-1 rounded-lg border">매수</button>
                    <button className="px-3 py-1 rounded-lg border">매도</button>
                    <button className="px-3 py-1 rounded-lg">자세히 보기</button>
                  </div>

                  <div className="mt-4 text-sm text-slate-600">권장 전략: {h.recommendation}</div>
                </div>

                <div className="w-full md:w-72">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={h.miniSeries}>
                        <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => (v / 1000) + "k"} />
                        <Tooltip formatter={(value) => currency(value)} />
                        <Line type="monotone" dataKey="p" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 text-sm text-slate-500">
                    권장 액션 및 메모
                    <ul className="mt-2 list-disc list-inside text-slate-600">
                      <li>목표가 도달 시 분할 매도 권장</li>
                      <li>조정 시 분할매수로 평균단가 하향</li>
                      <li>손절가 이탈 시 자동 알림/예약 매도 활용</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <footer className="mt-6 text-center text-sm text-slate-500">
          <div>참고: 현재 화면은 샘플 데이터 기반입니다. 실시간 API를 연동하려면 <code className="bg-slate-100 px-1 rounded">fetchRealtimeData()</code>를 구현하세요.</div>
        </footer>
      </div>
    </div>
  );
}
