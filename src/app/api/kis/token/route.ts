import { NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export async function POST() {
    try {
        const accessToken = await ServerKisService.getAccessToken();

        if (!accessToken) {
            return NextResponse.json(
                { error: "Failed to retrieve access token" },
                { status: 500 }
            );
        }

        return NextResponse.json({ accessToken });
    } catch (error) {
        console.error("Token API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
