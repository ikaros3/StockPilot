import { NextRequest, NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");

    if (!symbol) {
        return NextResponse.json(
            { error: "Symbol is required" },
            { status: 400 }
        );
    }

    try {
        // 주식 현재가 시세 조회 (FHKST01010100)
        const data = await ServerKisService.callApi(
            "/uapi/domestic-stock/v1/quotations/inquire-price",
            "FHKST01010100",
            {
                FID_COND_MRKT_DIV_CODE: "J",
                FID_INPUT_ISCD: symbol,
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyData = data as any;

        if (!anyData?.output) {
            // API 에러 응답인 경우 그대로 반환하거나 에러 처리
            if (anyData?.rt_cd !== '0') {
                console.error("KIS API Error:", anyData?.msg1);
            }
            // Mock 데이터나 에러 반환 대신, 일단 원본 반환 (디버깅용)
            return NextResponse.json(anyData);
        }

        const o = anyData.output;
        const currentPrice = {
            stockCode: symbol,
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

        return NextResponse.json({ price: currentPrice });
    } catch (error) {
        console.error("Price API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch price data" },
            { status: 500 }
        );
    }
}
