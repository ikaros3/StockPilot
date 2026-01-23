import { NextRequest, NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export const dynamic = 'force-dynamic'; // 에뮬레이터 이슈 방지: 강제 동적 렌더링 설정

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const symbolsStr = searchParams.get('symbols');

        if (!symbolsStr) {
            return NextResponse.json(
                { error: "Symbols parameter is required" },
                { status: 400 }
            );
        }

        const symbols = symbolsStr.split(',').filter(s => s.trim().length > 0);

        if (symbols.length === 0) {
            return NextResponse.json(
                { error: "Symbols list is empty" },
                { status: 400 }
            );
        }

        // 최대 20개로 제한 (안전장치)
        const batchSymbols = symbols.slice(0, 20);

        try {
            // 병렬로 가격 정보 조회
            const results = await ServerKisService.getPrices(batchSymbols);

            // 표준 Response 사용
            return new Response(JSON.stringify({ prices: results }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (innerError) {
            console.error("ServerKisService.getPrices Error:", innerError);
            return NextResponse.json({ prices: {} });
        }
    } catch (error) {
        console.error("Batch Prices API Fatal Error:", error);
        return NextResponse.json(
            { prices: {}, error: "Internal Server Error (Handled)" },
            { status: 200 }
        );
    }
}
