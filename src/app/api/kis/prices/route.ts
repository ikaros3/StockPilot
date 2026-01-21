import { NextRequest, NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbols } = body;

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json(
                { error: "Symbols array is required" },
                { status: 400 }
            );
        }

        // 최대 20개로 제한 (안전장치)
        const batchSymbols = symbols.slice(0, 20);

        // 병렬로 가격 정보 조회
        const results = await ServerKisService.getPrices(batchSymbols);

        return NextResponse.json({ prices: results });
    } catch (error) {
        console.error("Batch Prices API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch batch prices" },
            { status: 500 }
        );
    }
}
