import { NextResponse } from "next/server";
// ServerKisService is imported dynamically to prevent load-time crashes

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

    // 3. Firestore Connection Test
    let firestoreDebug = null;
    try {
        const { getAdminDb } = await import("@/lib/firebase/admin");
        const adminDb = await getAdminDb(); // 여기서 초기화 에러가 나면 catch로 잡힘
        const testDoc = await adminDb.collection('system_metadata').doc('kis_token_prod').get();
        firestoreDebug = {
            status: "Connected",
            exists: testDoc.exists,
            projectId: (adminDb as any).blockSettings?.projectId || "Check Logs"
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
