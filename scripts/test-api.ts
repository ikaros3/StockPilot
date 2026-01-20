/**
 * API 연동 테스트 스크립트
 * 
 * 실행 방법:
 * npx tsx scripts/test-api.ts
 */

// 환경 변수 로드 (.env.local 파일에서)
import { config } from "dotenv";
config({ path: ".env.local" });

import { kisService } from "../src/services/market-data/kis-service";
import { dartService } from "../src/services/market-data/dart-service";
import { naverCrawler } from "../src/services/market-data/naver-crawler";

const TEST_STOCK_CODE = "005930"; // 삼성전자

async function testKisService() {
    console.log("\n" + "=".repeat(60));
    console.log("🏦 한국투자증권 KIS OpenAPI 테스트");
    console.log("=".repeat(60));

    console.log(`\n📍 현재 환경: ${kisService.getEnvironment()}`);
    console.log(`📍 실전투자 설정됨: ${kisService.isConfigured("prod")}`);
    console.log(`📍 모의투자 설정됨: ${kisService.isConfigured("vts")}`);

    // 현재가 조회
    console.log("\n--- 현재가 조회 ---");
    const price = await kisService.getCurrentPrice(TEST_STOCK_CODE);
    console.log(`종목: ${price.stockName || TEST_STOCK_CODE}`);
    console.log(`현재가: ${price.currentPrice.toLocaleString()}원`);
    console.log(`등락: ${price.changePrice > 0 ? "+" : ""}${price.changePrice.toLocaleString()}원 (${price.changeRate.toFixed(2)}%)`);
    console.log(`PER: ${price.per}, PBR: ${price.pbr}`);

    // 일별 시세 조회
    console.log("\n--- 일별 시세 조회 (최근 5일) ---");
    const dailyPrices = await kisService.getDailyPrices(TEST_STOCK_CODE);
    dailyPrices.slice(0, 5).forEach((p) => {
        console.log(`${p.date}: ${p.closePrice.toLocaleString()}원 (${p.changeRate >= 0 ? "+" : ""}${p.changeRate.toFixed(2)}%)`);
    });

    // 호가 조회
    console.log("\n--- 호가 조회 ---");
    const orderBook = await kisService.getOrderBook(TEST_STOCK_CODE);
    console.log(`시간: ${orderBook.timestamp}`);
    console.log(`총 매도잔량: ${orderBook.totalAskVolume.toLocaleString()}`);
    console.log(`총 매수잔량: ${orderBook.totalBidVolume.toLocaleString()}`);

    // 계좌 잔고 조회
    console.log("\n--- 계좌 잔고 조회 ---");
    const balance = await kisService.getAccountBalance();
    if (balance) {
        console.log(`예수금: ${balance.totalDeposit.toLocaleString()}원`);
        console.log(`총 평가금액: ${balance.totalEvaluationAmount.toLocaleString()}원`);
        console.log(`총 손익: ${balance.totalProfitLoss.toLocaleString()}원 (${balance.totalProfitLossRate.toFixed(2)}%)`);
        console.log(`보유 종목 수: ${balance.holdings.length}개`);
        balance.holdings.forEach((h) => {
            console.log(`  - ${h.stockName} (${h.stockCode}): ${h.quantity}주, ${h.profitLossRate.toFixed(2)}%`);
        });
    }

    // 환경 전환 테스트
    if (kisService.isBothEnvironmentsConfigured()) {
        console.log("\n--- 환경 전환 테스트 ---");
        kisService.setEnvironment("prod");
        console.log(`전환 후 환경: ${kisService.getEnvironment()}`);

        const prodPrice = await kisService.getCurrentPrice(TEST_STOCK_CODE);
        console.log(`실전투자 현재가: ${prodPrice.currentPrice.toLocaleString()}원`);

        // 다시 모의투자로 전환
        kisService.setEnvironment("vts");
    }
}

async function testDartService() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 DART OpenAPI 테스트");
    console.log("=".repeat(60));

    // 기업 정보 조회
    console.log("\n--- 기업 정보 조회 ---");
    const company = await dartService.getCompanyInfo(TEST_STOCK_CODE);
    if (company) {
        console.log(`회사명: ${company.corpName}`);
        console.log(`대표자: ${company.ceoName}`);
        console.log(`주소: ${company.address}`);
        console.log(`홈페이지: ${company.homepageUrl}`);
    }

    // 재무제표 조회
    console.log("\n--- 재무제표 조회 ---");
    const financials = await dartService.getFinancialStatements(TEST_STOCK_CODE, "2024");
    console.log(`재무제표 항목 수: ${financials.length}개`);
    financials.slice(0, 3).forEach((f) => {
        console.log(`  - ${f.accountNm}: ${(f.thstrmAmount / 100000000).toLocaleString()}억원`);
    });

    // 공시 정보 조회
    console.log("\n--- 공시 정보 조회 ---");
    const disclosures = await dartService.getDisclosures(TEST_STOCK_CODE);
    console.log(`공시 건수: ${disclosures.length}건`);
    disclosures.slice(0, 3).forEach((d) => {
        console.log(`  - [${d.rcpDate}] ${d.reportName}`);
    });

    // 재무 비율 계산
    console.log("\n--- 재무 비율 ---");
    const ratios = await dartService.getFinancialRatios(TEST_STOCK_CODE, 78000);
    console.log(`PER: ${ratios.per.toFixed(2)}`);
    console.log(`PBR: ${ratios.pbr.toFixed(2)}`);
    console.log(`ROE: ${ratios.roe.toFixed(2)}%`);
    console.log(`부채비율: ${ratios.debtRatio.toFixed(2)}%`);
}

async function testNaverCrawler() {
    console.log("\n" + "=".repeat(60));
    console.log("📰 네이버 금융 크롤러 테스트");
    console.log("=".repeat(60));

    // 종목 개요 조회
    console.log("\n--- 종목 개요 조회 ---");
    const overview = await naverCrawler.getStockOverview(TEST_STOCK_CODE);
    console.log(`종목명: ${overview.stockName}`);
    console.log(`현재가: ${overview.currentPrice.toLocaleString()}원`);
    console.log(`시가총액: ${(overview.marketCap / 1000000000000).toFixed(1)}조원`);
    console.log(`PER: ${overview.per}, PBR: ${overview.pbr}`);
    console.log(`외국인 보유율: ${overview.foreignOwnership}%`);

    // 애널리스트 리포트 조회
    console.log("\n--- 애널리스트 리포트 ---");
    const reports = await naverCrawler.getAnalystReports(TEST_STOCK_CODE);
    console.log(`리포트 수: ${reports.length}건`);
    reports.slice(0, 3).forEach((r) => {
        console.log(`  - [${r.date}] ${r.firm}: ${r.title}`);
        console.log(`    의견: ${r.opinion}, 목표가: ${r.targetPrice?.toLocaleString() || "N/A"}원`);
    });

    // 컨센서스 조회
    console.log("\n--- 컨센서스 ---");
    const consensus = await naverCrawler.getConsensus(TEST_STOCK_CODE);
    console.log(`평균 목표가: ${consensus.averageTargetPrice.toLocaleString()}원`);
    console.log(`목표가 범위: ${consensus.lowTargetPrice.toLocaleString()} ~ ${consensus.highTargetPrice.toLocaleString()}원`);
    console.log(`상승여력: ${consensus.upside.toFixed(1)}%`);
    console.log(`투자의견: 매수 ${consensus.buyCount}, 보유 ${consensus.holdCount}, 매도 ${consensus.sellCount}`);

    // 뉴스 조회
    console.log("\n--- 뉴스 ---");
    const news = await naverCrawler.getNews(TEST_STOCK_CODE, 3);
    news.forEach((n) => {
        console.log(`  - [${n.date}] ${n.title} (${n.source})`);
    });
}

async function main() {
    console.log("🚀 StockPilot API 연동 테스트 시작\n");
    console.log("테스트 종목:", TEST_STOCK_CODE);

    try {
        await testKisService();
        await testDartService();
        await testNaverCrawler();

        console.log("\n" + "=".repeat(60));
        console.log("✅ 모든 테스트 완료!");
        console.log("=".repeat(60));
    } catch (error) {
        console.error("\n❌ 테스트 중 오류 발생:", error);
    }
}

main();
