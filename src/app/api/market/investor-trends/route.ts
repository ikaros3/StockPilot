import { NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await ServerKisService.getInvestorTrends();

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });
    } catch (error) {
        console.error("[API Investor Trends] Fatal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
