import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const StockAnalysisApp = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  const holdings = [
    {
      id: 1,
      name: '삼성전자',
      ticker: '005930',
      purchasePrice: 80920,
      quantity: 50,
      currentPrice: null
    },
    {
      id: 2,
      name: 'KODEX 레버리지',
      ticker: '122630',
      purchasePrice: 26634,
      quantity: 160,
      currentPrice: null
    }
  ];

  const analyzeStock = async (stock) => {
    setAnalyzing(true);
    setSelectedStock(stock);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `당신은 전문 증권 애널리스트입니다. 다음 종목에 대한 투자 분석을 제공해주세요.

종목 정보:
- 종목명: ${stock.name}
- 매수가: ${stock.purchasePrice.toLocaleString()}원
- 보유수량: ${stock.quantity}주
- 총 투자금액: ${(stock.purchasePrice * stock.quantity).toLocaleString()}원

다음 항목에 대해 구체적이고 실용적인 분석을 JSON 형식으로 제공해주세요:

{
  "sellTiming": {
    "targetPrice": "목표 매도가 (숫자)",
    "reason": "매도 추천 이유 (2-3문장)",
    "timeframe": "예상 시기"
  },
  "buyMore": {
    "recommended": true/false,
    "targetPrice": "추가 매수 추천가 (숫자)",
    "amount": "추가 매수 추천 금액",
    "timing": "추가 매수 시기 및 조건"
  },
  "profitLoss": {
    "profitTarget": "익절 목표가 (숫자)",
    "lossLimit": "손절 기준가 (숫자)",
    "strategy": "익절/손절 전략 설명"
  },
  "tradingStrategy": {
    "shortTerm": "단기 전략 (1-3개월)",
    "mediumTerm": "중기 전략 (3-6개월)",
    "longTerm": "장기 전략 (6개월 이상)"
  },
  "holdingPeriod": {
    "recommendation": "권장 보유 기간",
    "exitConditions": "매도 고려 조건들"
  },
  "analystSummary": {
    "consensus": "증권사 컨센서스",
    "keyPoints": ["주요 포인트 1", "주요 포인트 2", "주요 포인트 3"],
    "risks": "주요 리스크 요인"
  },
  "currentOutlook": {
    "marketCondition": "현재 시장 상황",
    "recommendation": "종합 투자 의견"
  }
}

실제 시장 상황과 최신 정보를 바탕으로 분석해주세요. JSON 형식만 반환하고 다른 텍스트는 포함하지 마세요.`
            }
          ],
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search"
            }
          ]
        })
      });

      const data = await response.json();
      let analysisText = data.content
        .map(item => item.type === "text" ? item.text : "")
        .filter(Boolean)
        .join("\n");

      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedAnalysis = JSON.parse(analysisText);
      setAnalysis(parsedAnalysis);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis({ error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateProfit = (stock) => {
    if (!stock.currentPrice) return null;
    const profit = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
    const profitRate = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice * 100);
    return { profit, profitRate };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <TrendingUp className="text-blue-600" />
            보유 종목 투자 분석
          </h1>
          <p className="text-slate-600">AI 기반 매매 전략 및 투자 인사이트</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {holdings.map((stock) => {
            const totalInvestment = stock.purchasePrice * stock.quantity;
            
            return (
              <div key={stock.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{stock.name}</h3>
                    <p className="text-sm text-slate-500">종목코드: {stock.ticker}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">매수가</p>
                    <p className="text-lg font-bold text-slate-800">
                      {stock.purchasePrice.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">보유수량</p>
                    <p className="text-lg font-semibold text-slate-700">{stock.quantity}주</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">투자금액</p>
                    <p className="text-lg font-semibold text-slate-700">
                      {totalInvestment.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => analyzeStock(stock)}
                  disabled={analyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {analyzing && selectedStock?.id === stock.id ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      AI 투자 분석 받기
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {analysis && !analysis.error && selectedStock && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {selectedStock.name} 투자 분석 리포트
              </h2>
              <p className="text-slate-600">AI 기반 종합 투자 전략 및 매매 타이밍 분석</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-green-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-800">매도 타이밍</h3>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-1">목표 매도가</p>
                  <p className="text-2xl font-bold text-green-600">
                    {typeof analysis.sellTiming?.targetPrice === 'number' 
                      ? analysis.sellTiming.targetPrice.toLocaleString() 
                      : analysis.sellTiming?.targetPrice}원
                  </p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-1">예상 시기</p>
                  <p className="text-slate-700 font-medium">{analysis.sellTiming?.timeframe}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">추천 이유</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.sellTiming?.reason}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="text-blue-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-800">추가 매수</h3>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-1">추천 여부</p>
                  <p className="text-lg font-bold text-blue-600">
                    {analysis.buyMore?.recommended ? '✓ 추천' : '✗ 비추천'}
                  </p>
                </div>
                {analysis.buyMore?.recommended && (
                  <>
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-1">추천 매수가</p>
                      <p className="text-xl font-bold text-blue-600">
                        {typeof analysis.buyMore?.targetPrice === 'number'
                          ? analysis.buyMore.targetPrice.toLocaleString()
                          : analysis.buyMore?.targetPrice}원
                      </p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-1">추천 금액</p>
                      <p className="text-slate-700 font-medium">{analysis.buyMore?.amount}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-1">매수 시기</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.buyMore?.timing}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-amber-600" size={24} />
                <h3 className="text-lg font-bold text-slate-800">익절/손절 전략</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">익절 목표가</p>
                  <p className="text-xl font-bold text-green-600">
                    {typeof analysis.profitLoss?.profitTarget === 'number'
                      ? analysis.profitLoss.profitTarget.toLocaleString()
                      : analysis.profitLoss?.profitTarget}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">손절 기준가</p>
                  <p className="text-xl font-bold text-red-600">
                    {typeof analysis.profitLoss?.lossLimit === 'number'
                      ? analysis.profitLoss.lossLimit.toLocaleString()
                      : analysis.profitLoss?.lossLimit}원
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">전략</p>
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.profitLoss?.strategy}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-slate-600" size={24} />
                <h3 className="text-lg font-bold text-slate-800">매매 전략</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">단기 전략 (1-3개월)</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.tradingStrategy?.shortTerm}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">중기 전략 (3-6개월)</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.tradingStrategy?.mediumTerm}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">장기 전략 (6개월 이상)</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.tradingStrategy?.longTerm}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-purple-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-800">보유 기간</h3>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-1">권장 보유 기간</p>
                  <p className="text-lg font-bold text-purple-600">{analysis.holdingPeriod?.recommendation}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">매도 고려 조건</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.holdingPeriod?.exitConditions}</p>
                </div>
              </div>

              <div className="bg-rose-50 rounded-xl p-6 border border-rose-200">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-rose-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-800">애널리스트 의견</h3>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-1">컨센서스</p>
                  <p className="text-lg font-bold text-rose-600">{analysis.analystSummary?.consensus}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-2">주요 포인트</p>
                  <ul className="space-y-1">
                    {analysis.analystSummary?.keyPoints?.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-rose-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">주요 리스크</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.analystSummary?.risks}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">종합 투자 의견</h3>
              <div className="mb-3">
                <p className="text-sm text-blue-100 mb-1">현재 시장 상황</p>
                <p className="text-white leading-relaxed">{analysis.currentOutlook?.marketCondition}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">최종 추천</p>
                <p className="text-lg font-semibold text-white">{analysis.currentOutlook?.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {analysis?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="text-red-600 mx-auto mb-3" size={48} />
            <p className="text-red-700 font-semibold">{analysis.error}</p>
          </div>
        )}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-semibold mb-1">투자 유의사항</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                본 분석은 AI 기반 참고 자료이며, 실제 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다. 
                과거 데이터 및 현재 시장 상황을 바탕으로 한 분석이므로 미래 수익을 보장하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysisApp;