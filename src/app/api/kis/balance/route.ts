import { NextRequest, NextResponse } from "next/server";
import { ServerKisService } from "@/services/market-data/server-kis-service";

export async function GET(request: NextRequest) {
    try {
        const { environment, config: activeConfig } = ServerKisService.getConfig();

        if (!activeConfig.accountNumber) {
            return NextResponse.json({ error: "Account number not configured" }, { status: 500 });
        }

        const [accountNum, accountProductCode] = activeConfig.accountNumber.split("-");
        const trId = environment === "prod" ? "TTTC8434R" : "VTTC8434R";

        // 주식 잔고 조회 (TTTC8434R / VTTC8434R)
        const data = await ServerKisService.callApi(
            "/uapi/domestic-stock/v1/trading/inquire-balance",
            trId,
            {
                CANO: accountNum,
                ACNT_PRDT_CD: accountProductCode || "01",
                AFHR_FLPR_YN: "N",
                OFL_YN: "",
                INQR_DVSN: "02",
                UNPR_DVSN: "01",
                FUND_STTL_ICLD_YN: "N",
                FNCG_AMT_AUTO_RDPT_YN: "N",
                PRCS_DVSN: "01",
                CTX_AREA_FK100: "",
                CTX_AREA_NK100: "",
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyData = data as any;

        if (!anyData?.output2?.[0]) {
            if (anyData?.rt_cd !== '0') {
                console.error("KIS API Balance Error:", anyData?.msg1);
            }
            return NextResponse.json(anyData);
        }

        const summary = anyData.output2[0];
        const holdings = anyData.output1 || [];

        const balance = {
            totalDeposit: parseInt(summary.dnca_tot_amt, 10),
            totalPurchaseAmount: parseInt(summary.pchs_amt_smtl_amt, 10),
            totalEvaluationAmount: parseInt(summary.tot_evlu_amt, 10),
            totalProfitLoss: parseInt(summary.evlu_pfls_smtl_amt, 10),
            totalProfitLossRate:
                parseInt(summary.pchs_amt_smtl_amt, 10) > 0
                    ? (parseInt(summary.evlu_pfls_smtl_amt, 10) /
                        parseInt(summary.pchs_amt_smtl_amt, 10)) *
                    100
                    : 0,
            holdings: holdings.map((h: any) => ({
                stockCode: h.pdno,
                stockName: h.prdt_name,
                quantity: parseInt(h.hldg_qty, 10),
                purchasePrice: parseFloat(h.pchs_avg_pric),
                currentPrice: parseInt(h.prpr, 10),
                evaluationAmount: parseInt(h.evlu_amt, 10),
                profitLoss: parseInt(h.evlu_pfls_amt, 10),
                profitLossRate: parseFloat(h.evlu_pfls_rt),
            })),
        };

        return NextResponse.json({ balance });

    } catch (error) {
        console.error("Balance API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch account balance" },
            { status: 500 }
        );
    }
}
