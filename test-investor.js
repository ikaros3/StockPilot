
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testInvestorData() {
    const env = process.env.KIS_ENVIRONMENT || "vts";
    const APP_KEY = env === "prod" ? process.env.KIS_PROD_APP_KEY : process.env.KIS_VTS_APP_KEY;
    const APP_SECRET = env === "prod" ? process.env.KIS_PROD_APP_SECRET : process.env.KIS_VTS_APP_SECRET;
    const BASE_URL = env === "prod" ? "https://openapi.koreainvestment.com:9443" : "https://openapivts.koreainvestment.com:29443";

    async function getToken() {
        const body = JSON.stringify({ grant_type: "client_credentials", appkey: APP_KEY, secretkey: APP_SECRET });
        const res = await fetch(`${BASE_URL}/oauth2/tokenP`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body });
        const data = await res.json();
        return data.access_token;
    }

    try {
        const token = await getToken();
        if (!token) return;

        const url = new URL(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor`);
        url.searchParams.append("FID_COND_MRKT_DIV_CODE", "J");
        url.searchParams.append("FID_INPUT_ISCD", "005930");

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY,
                "appsecret": APP_SECRET,
                "tr_id": "FHKST01010900",
                "custtype": "P"
            }
        });

        const data = await res.json();
        fs.writeFileSync('debug-investor.json', JSON.stringify(data, null, 2));
    } catch (err) {
        fs.writeFileSync('debug-investor.json', JSON.stringify({ error: err.message }));
    }
}

testInvestorData();
