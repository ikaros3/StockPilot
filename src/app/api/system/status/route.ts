import { NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export const dynamic = 'force-dynamic';

export async function GET() {
    const { environment, config } = ServerKisService.getConfig();

    // Masking helper
    const mask = (str: string) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : '(NOT SET)';

    // 1. IP / Region check
    let ipInfo = null;
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
            ipInfo = await ipRes.json();
        }
    } catch (e) {
        ipInfo = { error: 'Failed to fetch IP' };
    }

    // 2. Direct Token Request Test (Bypass Service Class for detailed error debug)
    let directTestResult = null;
    let baseUrl = environment === "prod"
        ? "https://openapi.koreainvestment.com:9443"
        : "https://openapivts.koreainvestment.com:29443";

    try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grant_type: "client_credentials",
                appkey: config.appKey,
                appsecret: config.appSecret,
            }),
            cache: 'no-store'
        });

        const text = await response.text();
        directTestResult = {
            status: response.status,
            statusText: response.statusText,
            duration: Date.now() - startTime,
            responseBodyPreview: text.substring(0, 500), // Show first 500 chars
            isSuccess: response.ok
        };
    } catch (e: any) {
        directTestResult = {
            error: e.message,
            stack: e.stack
        };
    }

    // 3. Region Check via Metadata Server (Cloud Run specific)
    let regionMetadata = 'Unknown';
    try {
        const metaRes = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/zone', {
            headers: { 'Metadata-Flavor': 'Google' }
        });
        if (metaRes.ok) regionMetadata = await metaRes.text();
    } catch (e) {
        // Not running on GCP or metadata server not reachable
    }

    const appSecret = config.appSecret || '';

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: environment,
        config: {
            appKeyVal: mask(config.appKey),
            appSecretLength: appSecret.length, // 길이 확인
            appSecretPreview: appSecret.length > 5 ? `${appSecret.substring(0, 3)}...${appSecret.substring(appSecret.length - 3)}` : 'Too Short', // 앞뒤 확인
            accountNo: mask(config.accountNumber)
        },
        serverInfo: {
            nodeEnv: process.env.NODE_ENV,
            publicIp: ipInfo,
            serviceName: process.env.K_SERVICE,
            revision: process.env.K_REVISION,
            regionMetadata: regionMetadata
        },
        connectionDebug: directTestResult
    });
}
