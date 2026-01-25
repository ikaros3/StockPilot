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

        // 기간별 시세 (일/주/월/년 + 1분)
        if (dataType === "all" || dataType === "daily") {
            const period = searchParams.get("period") || "D"; // D, W, M, Y, 1m

            // 1. 분봉 (1분) 처리
            if (period === "1m") {
                const today = new Date();
                // HHMMSS 형식의 현재 시간 (VTS 호환성을 위해 현재 시간 그대로 전송)
                const timeStr = today.toTimeString().slice(0, 8).replace(/:/g, "");

                const resultData = await ServerKisService.callApi(
                    "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
                    "FHKST03010200",
                    {
                        FID_COND_MRKT_DIV_CODE: "J",
                        FID_INPUT_ISCD: stockCode,
                        FID_INPUT_HOUR_1: timeStr,
                        FID_PW_DATA_INCU_YN: "Y",
                    }
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyData = resultData as any;

                // 응답 처리 강화
                const isWeekend = today.getDay() === 0 || today.getDay() === 6;
                const isPreMarket = !isWeekend && (today.getHours() < 9);

                if (!anyData) {
                    console.warn('[API] 1m chart data is null');
                    result.dailyPrices = [];
                } else if (!anyData.rt_cd || anyData.rt_cd === "") {
                    // rt_cd가 비어있는 경우 (VTS 등에서 데이터 없음일 때 발생 가능)
                    if (isWeekend || isPreMarket) {
                        console.info(`[API] 1m chart: No data (Weekend/Pre-market on VTS). Code: ${stockCode}`);
                    } else {
                        console.warn(`[API] 1m chart empty response for ${stockCode} at ${timeStr}`);
                    }
                    result.dailyPrices = [];
                } else if (anyData.rt_cd !== '0') {
                    console.error(`[API] 1m chart error: ${anyData.msg1} (${anyData.rt_cd})`);
                    result.dailyPrices = [];
                } else if (anyData?.output2) {
                    // 1. 데이터 파싱 및 정렬 (시간순)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rawData = anyData.output2.map((item: any) => ({
                        date: `${item.stck_bsop_date}${item.stck_cntg_hour}`, // YYYYMMDDHHMMSS
                        openPrice: parseInt(item.stck_oprc, 10),
                        highPrice: parseInt(item.stck_hgpr, 10),
                        lowPrice: parseInt(item.stck_lwpr, 10),
                        closePrice: parseInt(item.stck_prpr, 10),
                        volume: parseInt(item.cntg_vol, 10),
                        tradingValue: 0,
                        changeRate: 0,
                    })).reverse();

                    // 2. 무거래 분(Gap) 채우기 로직
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fillMinuteGaps = (data: any[]) => {
                        if (data.length === 0) return [];

                        const filledData = [];

                        // 기준 날짜 (YYYYMMDD)
                        const baseDateStr = data[0].date.substring(0, 8);

                        // 시작 시간: 09:00:00
                        const startTime = new Date(
                            parseInt(baseDateStr.substring(0, 4)),
                            parseInt(baseDateStr.substring(4, 6)) - 1,
                            parseInt(baseDateStr.substring(6, 8)),
                            9, 0, 0
                        );

                        // 종료 시간 결정: 데이터의 마지막 시간 vs 15:30:00
                        // 장 중이라면 현재 시간까지만 채워야 함.
                        // 데이터의 마지막 시간이 15:30을 넘으면(시간외) 그것까지 포함.
                        // 기본적으로 15:30까지 채우되, 현재 시간이 그 전이면 현재 시간까지만.

                        // 데이터 마지막 시간
                        const lastDataTimeStr = data[data.length - 1].date;
                        const lastDataDate = new Date(
                            parseInt(lastDataTimeStr.substring(0, 4)),
                            parseInt(lastDataTimeStr.substring(4, 6)) - 1,
                            parseInt(lastDataTimeStr.substring(6, 8)),
                            parseInt(lastDataTimeStr.substring(8, 10)),
                            parseInt(lastDataTimeStr.substring(10, 12)),
                            0
                        );

                        // 장 마감 시간 (15:30)
                        const marketEndTime = new Date(startTime);
                        marketEndTime.setHours(15, 30, 0);

                        // 채울 범위의 끝: Max(데이터 마지막 시간, Min(현재 시간, 장마감))
                        // 하지만 1분봉은 미래를 그리지 않으므로, 데이터 마지막 시간과 장마감 사이를 채우는 것이 주 목적 (중간 이빨 빠진거)
                        // 또는 장 시작부터 데이터 첫 시간까지?
                        // 여기서는 "중간 거래가 없는 분"을 처리하는 것이 핵심.
                        // start check는 09:00 부터.
                        // end check는 lastDataTime 까지 (데이터가 아예 끊긴 뒷부분은 그리지 않는게 데이터 왜곡 방지일 수도 있음. 
                        // 하지만 장 중인데 거래가 없어서 데이터가 안 들어오는 경우라면 채워야 함 (현재 시간까지))

                        const now = new Date();
                        const isToday = baseDateStr === now.toISOString().slice(0, 10).replace(/-/g, "");

                        // 종료 시간 설정
                        let endTime = marketEndTime;
                        if (isToday) {
                            // 오늘이면 현재 시간과 15:30 중 빠른 것
                            if (now < marketEndTime) {
                                endTime = now;
                            }
                        } else {
                            // 과거 날짜면 무조건 15:30까지 (또는 데이터 마지막까지?)
                            // 보통 과거 차트는 15:30까지 꽉 참.
                        }

                        // 순회용 커서
                        let currentTime = new Date(startTime);
                        let dataIndex = 0;
                        let lastClose = data.length > 0 ? data[0].openPrice : 0; // 시가로 초기화

                        // 데이터 인덱스 매칭을 위한 Map 생성 (검색 효율화)
                        const dataMap = new Map();
                        data.forEach(item => {
                            dataMap.set(item.date, item);
                        });

                        while (currentTime <= endTime) {
                            const year = currentTime.getFullYear();
                            const month = String(currentTime.getMonth() + 1).padStart(2, '0');
                            const day = String(currentTime.getDate()).padStart(2, '0');
                            const hour = String(currentTime.getHours()).padStart(2, '0');
                            const minute = String(currentTime.getMinutes()).padStart(2, '0');
                            const second = "00";

                            const dateKey = `${year}${month}${day}${hour}${minute}${second}`;

                            if (dataMap.has(dateKey)) {
                                const item = dataMap.get(dateKey);
                                filledData.push(item);
                                lastClose = item.closePrice;
                            } else {
                                // 데이터 없음 -> 이전 종가로 채움 (Volume 0)
                                // 단, currentTime이 데이터의 첫 시간보다 이전이라면? (09:00 ~ 첫 거래)
                                // 전일 종가가 필요하지만, 여기선 당일 시초가가 발생하기 전이므로
                                // API 데이터의 첫 `openPrice`를 사용하거나, 아직 안 그리는게 나을수도.
                                // 일단 09:00부터 데이터가 있는 곳까지는 '장 시작 전/무거래'로 간주.
                                // 만약 데이터가 하나도 없다면? (위에서 return 처리됨)

                                // 데이터가 아직 시작 안됐다면 채우지 않음? 
                                // User logic: "09:06, 07 거래 없음 -> 채움"
                                // 즉, 중간 Gap을 채우는 것이 중요.
                                // 09:00에 거래 없고 09:05에 첫 거래면 09:00~09:04는? 
                                // 보통 차트는 09:00부터 시작하므로 채우는게 맞음 (시초가 기준? 전일 종가 기준?)
                                // 전일 종가를 모르면 첫 데이터 OpenPrice로 Backfill.

                                // Backfill for start
                                if (filledData.length === 0 && data.length > 0) {
                                    lastClose = data[0].openPrice;
                                }

                                filledData.push({
                                    date: dateKey,
                                    openPrice: lastClose,
                                    highPrice: lastClose,
                                    lowPrice: lastClose,
                                    closePrice: lastClose,
                                    volume: 0,
                                    tradingValue: 0,
                                    changeRate: 0,
                                });
                            }

                            // 1분 증가
                            currentTime.setMinutes(currentTime.getMinutes() + 1);
                        }

                        return filledData;
                    };

                    result.dailyPrices = fillMinuteGaps(rawData);
                } else {
                    result.dailyPrices = [];
                }
            }
            // 2. 일/주/월/년봉 처리
            else {
                const today = new Date();
                const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

                // 기간별 조회 일수 조정
                let days = 200; // 일봉 기본
                if (period === "W") days = 365 * 2; // 주봉 2년
                if (period === "M") days = 365 * 5; // 월봉 5년
                if (period === "Y") days = 365 * 10; // 년봉 10년

                const resultData = await ServerKisService.callApi(
                    "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
                    "FHKST03010100",
                    {
                        FID_COND_MRKT_DIV_CODE: "J",
                        FID_INPUT_ISCD: stockCode,
                        FID_INPUT_DATE_1: formatDate(new Date(today.getTime() - days * 24 * 60 * 60 * 1000)),
                        FID_INPUT_DATE_2: formatDate(today),
                        FID_PERIOD_DIV_CODE: period, // D, W, M, Y
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

        // 투자자 동향 (나중에 해결하기 위해 임시로 비활성화)
        if (dataType === "investor") {
            // const investors = await naverCrawler.getInvestorTrends(stockCode);
            result.investors = null;
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
