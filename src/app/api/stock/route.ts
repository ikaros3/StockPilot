/**
 * 종목 데이터 API Route
 * 클라이언트 컴포넌트에서 종목 데이터를 가져올 때 사용
 */

import { NextRequest, NextResponse } from "next/server";
// import { kisService } from "@/services/market-data/kis-service"; // Client Service 제거
import { ServerKisService } from "@/services/market-data/server-kis-service"; // Server Service 추가
import { dartService } from "@/services/market-data/dart-service";
import { naverCrawler } from "@/services/market-data/naver-crawler";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const stockCode = searchParams.get("stockCode");
    const dataType = searchParams.get("type") || "all";

    if (!stockCode) {
        return NextResponse.json({ error: "stockCode is required" }, { status: 400 });
    }

    try {
        const result: Record<string, unknown> = { stockCode };

        // 기본 가격 정보
        if (dataType === "all" || dataType === "price") {
            const resultData = await ServerKisService.callApi(
                "/uapi/domestic-stock/v1/quotations/inquire-price",
                "FHKST01010100",
                {
                    FID_COND_MRKT_DIV_CODE: "J",
                    FID_INPUT_ISCD: stockCode,
                }
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyData = resultData as any;

            if (anyData?.output) {
                const o = anyData.output;
                result.price = {
                    stockCode: stockCode,
                    stockName: "",
                    currentPrice: parseInt(o.stck_prpr, 10),
                    changePrice: parseInt(o.prdy_vrss, 10),
                    changeRate: parseFloat(o.prdy_ctrt),
                    openPrice: parseInt(o.stck_oprc, 10),
                    highPrice: parseInt(o.stck_hgpr, 10),
                    lowPrice: parseInt(o.stck_lwpr, 10),
                    volume: parseInt(o.acml_vol, 10),
                    tradingValue: parseInt(o.acml_tr_pbmn, 10),
                    marketCap: parseInt(o.hts_avls, 10) * 100000000,
                    per: parseFloat(o.per),
                    pbr: parseFloat(o.pbr),
                    eps: parseFloat(o.eps),
                    bps: parseFloat(o.bps),
                    yearHighPrice: parseInt(o.w52_hgpr, 10),
                    yearLowPrice: parseInt(o.w52_lwpr, 10),
                };
            }
        }

        // 일별 시세
        if (dataType === "all" || dataType === "daily") {
            const today = new Date();
            const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

            const resultData = await ServerKisService.callApi(
                "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
                "FHKST03010100",
                {
                    FID_COND_MRKT_DIV_CODE: "J",
                    FID_INPUT_ISCD: stockCode,
                    FID_INPUT_DATE_1: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), // 30일 전
                    FID_INPUT_DATE_2: formatDate(today),
                    FID_PERIOD_DIV_CODE: "D",
                    FID_ORG_ADJ_PRC: "0",
                }
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyData = resultData as any;

            if (anyData?.output2) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                result.dailyPrices = anyData.output2.map((item: any) => ({
                    date: item.stck_bsop_date,
                    openPrice: parseInt(item.stck_oprc, 10),
                    highPrice: parseInt(item.stck_hgpr, 10),
                    lowPrice: parseInt(item.stck_lwpr, 10),
                    closePrice: parseInt(item.stck_clpr, 10),
                    volume: parseInt(item.acml_vol, 10),
                    tradingValue: parseInt(item.acml_tr_pbmn, 10),
                    changeRate: parseFloat(item.prdy_ctrt),
                }));
            }
        }

        // 호가 (제외됨)
        // if (dataType === "orderbook") { ... }

        // 기업 정보 (DART)
        if (dataType === "all" || dataType === "company") {
            const companyInfo = await dartService.getCompanyInfo(stockCode);
            result.company = companyInfo;
        }

        // 재무제표 (DART)
        if (dataType === "financial") {
            const year = new Date().getFullYear().toString();
            const financials = await dartService.getFinancialStatements(stockCode, year);
            result.financials = financials;
        }

        // 재무 비율 (DART)
        if (dataType === "all" || dataType === "ratios") {
            // 현재가 정보가 위에 있으면 재사용, 없으면 다시 조회해야 하지만
            // type=all 이면 위에서 조회했을 것임.
            // 단순화를 위해 result.price가 있으면 사용하고 없으면 null 처리
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentPrice = (result.price as any)?.currentPrice;
            if (currentPrice) {
                const ratios = await dartService.getFinancialRatios(stockCode, currentPrice);
                result.ratios = ratios;
            }
        }

        // 공시 정보 (DART)
        if (dataType === "disclosure") {
            const disclosures = await dartService.getDisclosures(stockCode);
            result.disclosures = disclosures.slice(0, 20); // 최근 20건
        }

        // 애널리스트 리포트 (네이버)
        if (dataType === "all" || dataType === "analyst") {
            const reports = await naverCrawler.getAnalystReports(stockCode);
            const consensus = await naverCrawler.getConsensus(stockCode);
            result.analystReports = reports;
            result.consensus = consensus;
        }

        // 뉴스 (네이버)
        if (dataType === "news") {
            const news = await naverCrawler.getNews(stockCode, 10);
            result.news = news;
        }

        // 네이버 종목 개요
        if (dataType === "overview") {
            const overview = await naverCrawler.getStockOverview(stockCode);
            result.overview = overview;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[API] Stock data fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock data" },
            { status: 500 }
        );
    }
}
