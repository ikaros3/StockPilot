import { NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { indices, isMarketOpen } = await ServerKisService.getIndices();

        // 캐싱 헤더 설정 (최대 1분)
        return NextResponse.json(
            { indices, isMarketOpen },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
                }
            }
        );
    } catch (error) {
        console.error("[API Indices] Fatal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
