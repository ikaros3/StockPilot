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

        try {
            // 병렬로 가격 정보 조회
            const results = await ServerKisService.getPrices(batchSymbols);
            return NextResponse.json({ prices: results });
        } catch (innerError) {
            console.error("ServerKisService.getPrices Error:", innerError);
            // 서비스 계층 에러 시에도 200 OK 반환 (빈 결과) - 재시도 루프 방지
            return NextResponse.json({ prices: {} });
        }
    } catch (error) {
        console.error("Batch Prices API Fatal Error:", error);
        // 치명적 에러 시에도 200 OK 반환 (빈 결과) - 재시도 루프 방지
        return NextResponse.json(
            { prices: {}, error: "Internal Server Error (Handled)" },
            { status: 200 }
        );
    }
}
