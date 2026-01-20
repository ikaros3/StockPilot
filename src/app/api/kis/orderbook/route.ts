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
        // 주식 현재가 호가 예상체결가 모니터 조회 (FHKST01010200)
        const data = await ServerKisService.callApi(
            "/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn",
            "FHKST01010200",
            {
                FID_COND_MRKT_DIV_CODE: "J",
                FID_INPUT_ISCD: symbol,
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyData = data as any;

        if (!anyData?.output1) {
            return NextResponse.json(anyData);
        }

        const o = anyData.output1;
        const orderBook = {
            stockCode: symbol,
            timestamp: o.aspr_acpt_hour,
            askPrices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i: number) =>
                parseInt(o[`askp${i}`] as string, 10)
            ),
            askVolumes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i: number) =>
                parseInt(o[`askp_rsqn${i}`] as string, 10)
            ),
            bidPrices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i: number) =>
                parseInt(o[`bidp${i}`] as string, 10)
            ),
            bidVolumes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i: number) =>
                parseInt(o[`bidp_rsqn${i}`] as string, 10)
            ),
            totalAskVolume: parseInt(o.total_askp_rsqn, 10),
            totalBidVolume: parseInt(o.total_bidp_rsqn, 10),
        };

        // 클라이언트 컴포넌트가 기대하는 asks/bids 객체 배열 구조로 변환 (OrderBookData interface 호환)
        const formattedOrderBook = {
            ...orderBook,
            asks: orderBook.askPrices.map((p: number, i: number) => ({
                price: p,
                quantity: orderBook.askVolumes[i],
            })),
            bids: orderBook.bidPrices.map((p: number, i: number) => ({
                price: p,
                quantity: orderBook.bidVolumes[i],
            })),
            totalAskQuantity: orderBook.totalAskVolume,
            totalBidQuantity: orderBook.totalBidVolume
        };

        return NextResponse.json({ orderBook: formattedOrderBook });
    } catch (error) {
        console.error("Orderbook API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch orderbook data" },
            { status: 500 }
        );
    }
}
