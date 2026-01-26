import { NextResponse } from "next/server";
import { getDocument } from "@/lib/firebase/firestore-rest";

export const dynamic = 'force-dynamic';

export async function GET() {
    let ServerKisService: any;
    try {
        const module = await import("@/services/market-data/server-kis-service");
        ServerKisService = module.ServerKisService;
    } catch (e: any) {
        return NextResponse.json({
            error: "Failed to load ServerKisService module",
            message: e.message,
            stack: e.stack
        }, { status: 500 });
    }

    const { environment, config } = ServerKisService.getConfig();
    const mask = (str: string) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : '(NOT SET)';

    // 1. IP 확인
    let ipInfo = null;
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) ipInfo = await ipRes.json();
    } catch {
        ipInfo = { error: 'Failed to fetch IP' };
    }

    // 2. KIS 토큰 테스트
    let directTestResult = null;
    const baseUrl = environment === "prod"
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
            responseBodyPreview: text.substring(0, 500),
            isSuccess: response.ok
        };
    } catch (e: any) {
        directTestResult = { error: e.message, stack: e.stack };
    }

    // 3. Region 확인
    let regionMetadata = 'Unknown';
    try {
        const metaRes = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/zone', {
            headers: { 'Metadata-Flavor': 'Google' }
        });
        if (metaRes.ok) regionMetadata = await metaRes.text();
    } catch { /* Not on GCP */ }

    // 4. Firestore REST API 테스트
    let firestoreDebug = null;
    try {
        const data = await getDocument('system_metadata', 'kis_token_prod');
        firestoreDebug = {
            status: "Connected",
            hasToken: !!data?.accessToken,
            expiresAt: data?.expiresAt || null
        };
    } catch (e: any) {
        firestoreDebug = {
            status: "Error",
            message: e.message,
            stack: e.stack
        };
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: environment,
        config: {
            appKeyVal: mask(config.appKey),
            appSecretVal: !!config.appSecret,
            accountNo: mask(config.accountNumber)
        },
        serverInfo: {
            nodeEnv: process.env.NODE_ENV,
            publicIp: ipInfo,
            regionMetadata: regionMetadata
        },
        firestoreDebug: firestoreDebug,
        connectionDebug: directTestResult
    });
}
