import { NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export const dynamic = 'force-dynamic';

export async function GET() {
    const { environment, config } = ServerKisService.getConfig();

    // Masking helper
    const mask = (str: string) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : '(NOT SET)';

    // IP / Region check (Optional, might be slow)
    let ipInfo = null;
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
            ipInfo = await ipRes.json();
        }
    } catch (e) {
        ipInfo = { error: 'Failed to fetch IP' };
    }

    // Attempt to get token (Test Connection)
    let connectionTest = "NOT_ATTEMPTED";
    let tokenError = null;
    try {
        const token = await ServerKisService.getAccessToken();
        connectionTest = token ? "SUCCESS" : "FAILED_TO_GET_TOKEN";
    } catch (e: any) {
        connectionTest = "ERROR";
        tokenError = e.message;
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: environment,
        config: {
            appKeyVal: mask(config.appKey),
            appSecretVal: !!config.appSecret, // Don't even mask secret, just boolean
            accountNo: mask(config.accountNumber)
        },
        serverInfo: {
            nodeEnv: process.env.NODE_ENV,
            regionGuess: Intl.DateTimeFormat().resolvedOptions().timeZone,
            publicIp: ipInfo
        },
        connectionTest: {
            status: connectionTest,
            error: tokenError
        }
    });
}
