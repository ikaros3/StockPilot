import { NextRequest, NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const period = searchParams.get("period") || "D";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    try {
        // 일별 시세 조회 (FHKST03010100)
        // KIS API input date format: YYYYMMDD
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

        // Default to last 365 days if not specified
        const defaultStart = formatDate(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000));
        const defaultEnd = formatDate(today);

        const data = await ServerKisService.callApi(
            "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
            "FHKST03010100",
            {
                FID_COND_MRKT_DIV_CODE: "J",
                FID_INPUT_ISCD: symbol,
                FID_INPUT_DATE_1: startDate?.replace(/-/g, "") || defaultStart,
                FID_INPUT_DATE_2: endDate?.replace(/-/g, "") || defaultEnd,
                FID_PERIOD_DIV_CODE: period,
                FID_ORG_ADJ_PRC: "0",
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyData = data as any;

        if (!anyData?.output2) {
            if (anyData?.rt_cd !== '0') {
                console.error("KIS API Daily Price Error:", anyData?.msg1);
            }
            return NextResponse.json(anyData);
        }

        const dailyPrices = anyData.output2.map((item: any) => ({
            date: item.stck_bsop_date,
            openPrice: parseInt(item.stck_oprc, 10),
            highPrice: parseInt(item.stck_hgpr, 10),
            lowPrice: parseInt(item.stck_lwpr, 10),
            closePrice: parseInt(item.stck_clpr, 10),
            volume: parseInt(item.acml_vol, 10),
            tradingValue: parseInt(item.acml_tr_pbmn, 10),
            changeRate: parseFloat(item.prdy_ctrt),
        }));

        return NextResponse.json({ dailyPrices });

    } catch (error) {
        console.error("Daily Price API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch daily price data" },
            { status: 500 }
        );
    }
}
