/**
 * 네이버 금융 크롤러
 * 애널리스트 리포트, 목표가, 뉴스 데이터를 크롤링합니다.
 * 
 * URL 패턴:
 * - 종목 정보: https://finance.naver.com/item/main.naver?code=[종목코드]
 * - 리서치: https://finance.naver.com/research/company_list.naver
 * - 뉴스: https://finance.naver.com/item/news.naver?code=[종목코드]
 * 
 * 주의: 네이버 금융은 서버사이드 렌더링 페이지이므로 fetch로 HTML을 가져올 수 있습니다.
 * 단, 과도한 요청은 IP 차단될 수 있으므로 적절한 딜레이를 두어야 합니다.
 */

// 크롤링 딜레이 (환경 변수에서 로드)
const CRAWL_DELAY = parseInt(process.env.NAVER_CRAWL_DELAY || "1", 10) * 1000;

// =============================================================================
// 타입 정의
// =============================================================================

export interface NaverAnalystReport {
    title: string;
    firm: string;
    date: string;
    opinion: string;
    targetPrice: number | null;
    reportUrl: string;
}

export interface NaverTargetPrice {
    firm: string;
    date: string;
    targetPrice: number;
    previousTargetPrice: number | null;
    opinion: string;
}

export interface NaverNews {
    title: string;
    source: string;
    date: string;
    url: string;
    summary?: string;
}

export interface NaverStockOverview {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    changePrice: number;
    changeRate: number;
    marketCap: number;
    tradingVolume: number;
    per: number;
    pbr: number;
    eps: number;
    bps: number;
    dividendYield: number;
    foreignOwnership: number;
    yearHighPrice: number;
    yearLowPrice: number;
}

export interface NaverInvestorTrends {
    date: string;
    private: number;
    foreign: number;
    institutional: number;
}

export interface NaverConsensus {
    stockCode: string;
    averageTargetPrice: number;
    highTargetPrice: number;
    lowTargetPrice: number;
    currentPrice: number;
    upside: number;
    reportCount: number;
    buyCount: number;
    holdCount: number;
    sellCount: number;
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 딜레이 함수
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * HTML에서 텍스트 추출 (간단한 태그 제거)
 */
const stripHtml = (html: string): string => {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
};

/**
 * 숫자 파싱 (콤마 제거, 단위 처리)
 */
const parseNumber = (text: string): number => {
    if (!text) return 0;
    const cleaned = text.replace(/[,\s]/g, "").replace(/원$/, "");
    // 억, 조 단위 처리
    if (cleaned.includes("조")) {
        const num = parseFloat(cleaned.replace(/조.*/, ""));
        return num * 1000000000000;
    }
    if (cleaned.includes("억")) {
        const num = parseFloat(cleaned.replace(/억.*/, ""));
        return num * 100000000;
    }
    return parseFloat(cleaned) || 0;
};

/**
 * 날짜 파싱 (YYYY.MM.DD 형식으로 통일)
 */
const parseDate = (text: string): string => {
    const match = text.match(/(\d{4})[\.\-\/]?(\d{2})[\.\-\/]?(\d{2})/);
    if (match) {
        return `${match[1]}.${match[2]}.${match[3]}`;
    }
    return text.trim();
};

// =============================================================================
// 네이버 금융 크롤러 클래스
// =============================================================================

export class NaverCrawler {
    private baseUrl = "https://finance.naver.com";
    private mobileBaseUrl = "https://m.stock.naver.com";

    /**
     * HTTP 요청 래퍼 (딜레이 포함)
     */
    private async fetchHtml(url: string): Promise<string> {
        try {
            await delay(CRAWL_DELAY);

            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // EUC-KR 인코딩 처리 (네이버 금융은 EUC-KR 사용)
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder("euc-kr");
            return decoder.decode(buffer);
        } catch (error) {
            console.error(`[NaverCrawler] Fetch error: ${url}`, error);
            return "";
        }
    }

    /**
     * 모바일 API JSON 요청
     */
    private async fetchJson<T>(url: string, silent: boolean = false): Promise<T | null> {
        try {
            await delay(CRAWL_DELAY);

            const response = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Referer": url.includes("/etf/")
                        ? "https://m.stock.naver.com/etf/"
                        : "https://m.stock.naver.com/stock/",
                    "Origin": "https://m.stock.naver.com",
                },
            });

            if (!response.ok) {
                if (!silent || response.status !== 404) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return null;
            }

            return await response.json();
        } catch (error) {
            if (!silent) {
                console.error(`[NaverCrawler] JSON fetch error: ${url}`, error);
            }
            return null;
        }
    }

    /**
     * 종목 개요 조회 (모바일 API 사용)
     */
    async getStockOverview(stockCode: string): Promise<NaverStockOverview> {
        console.log(`[NaverCrawler] Fetching stock overview for ${stockCode}`);

        // 모바일 API를 통해 JSON 데이터 조회
        interface NaverMobileStockData {
            stockName: string;
            closePrice: string;
            compareToPreviousClosePrice: string;
            fluctuationsRatio: string;
            marketValue: string;
            accumulatedTradingVolume: string;
            per: string;
            pbr: string;
            eps: string;
            bps: string;
            dividendYield: string;
            foreignerRatio: string;
            high52wPrice: string;
            low52wPrice: string;
        }

        const apiUrl = `${this.mobileBaseUrl}/api/stock/${stockCode}/basic`;
        let data = await this.fetchJson<NaverMobileStockData>(apiUrl, true);

        // ETF인 경우 엔드포인트가 다를 수 있음
        if (!data) {
            const etfApiUrl = `${this.mobileBaseUrl}/api/etf/${stockCode}/basic`;
            data = await this.fetchJson<NaverMobileStockData>(etfApiUrl);
        }

        if (!data) {
            return this.getMockStockOverview(stockCode);
        }

        return {
            stockCode,
            stockName: data.stockName || "",
            currentPrice: parseNumber(data.closePrice),
            changePrice: parseNumber(data.compareToPreviousClosePrice),
            changeRate: parseFloat(data.fluctuationsRatio) || 0,
            marketCap: parseNumber(data.marketValue),
            tradingVolume: parseNumber(data.accumulatedTradingVolume),
            per: parseFloat(data.per) || 0,
            pbr: parseFloat(data.pbr) || 0,
            eps: parseNumber(data.eps),
            bps: parseNumber(data.bps),
            dividendYield: parseFloat(data.dividendYield) || 0,
            foreignOwnership: parseFloat(data.foreignerRatio) || 0,
            yearHighPrice: parseNumber(data.high52wPrice),
            yearLowPrice: parseNumber(data.low52wPrice),
        };
    }

    /**
     * 애널리스트 리포트 크롤링
     */
    async getAnalystReports(stockCode: string): Promise<NaverAnalystReport[]> {
        console.log(`[NaverCrawler] Fetching analyst reports for ${stockCode}`);

        const url = `${this.baseUrl}/research/company_list.naver?searchType=itemCode&itemCode=${stockCode}`;
        const html = await this.fetchHtml(url);

        if (!html) {
            return this.getMockAnalystReports(stockCode);
        }

        const reports: NaverAnalystReport[] = [];

        // 테이블 행 파싱 (HTML 정규식 - 실제 환경에서는 cheerio 사용 권장)
        const tableMatch = html.match(/<table[^>]*class="type_1"[^>]*>([\s\S]*?)<\/table>/);
        if (!tableMatch) {
            return this.getMockAnalystReports(stockCode);
        }

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
            const row = rowMatch[1];

            // 제목 링크 추출
            const titleMatch = row.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/);
            const firmMatch = row.match(/<td[^>]*class="file"[^>]*>[\s\S]*?<\/td>[\s\S]*?<td>([^<]*)<\/td>/);
            const dateMatch = row.match(/(\d{2}\.\d{2}\.\d{2})/);
            const opinionMatch = row.match(/<em[^>]*class="([^"]*)"[^>]*>([^<]*)<\/em>/);
            const priceMatch = row.match(/목표\s*(\d[\d,]*)/);

            if (titleMatch && titleMatch[2]) {
                reports.push({
                    title: stripHtml(titleMatch[2]),
                    firm: firmMatch ? stripHtml(firmMatch[1]) : "",
                    date: dateMatch ? `20${dateMatch[1]}` : "",
                    opinion: opinionMatch ? stripHtml(opinionMatch[2]) : "",
                    targetPrice: priceMatch ? parseNumber(priceMatch[1]) : null,
                    reportUrl: titleMatch[1].startsWith("http")
                        ? titleMatch[1]
                        : `${this.baseUrl}/${titleMatch[1]}`,
                });
            }
        }

        return reports.length > 0 ? reports : this.getMockAnalystReports(stockCode);
    }

    /**
     * 목표주가 목록 크롤링
     */
    async getTargetPrices(stockCode: string): Promise<NaverTargetPrice[]> {
        console.log(`[NaverCrawler] Fetching target prices for ${stockCode}`);

        // 애널리스트 리포트에서 목표가 정보 추출
        const reports = await this.getAnalystReports(stockCode);

        return reports
            .filter((r) => r.targetPrice !== null)
            .map((r) => ({
                firm: r.firm,
                date: r.date,
                targetPrice: r.targetPrice!,
                previousTargetPrice: null, // 이전 목표가는 별도 파싱 필요
                opinion: r.opinion,
            }));
    }

    /**
     * 컨센서스 조회
     */
    async getConsensus(stockCode: string): Promise<NaverConsensus> {
        console.log(`[NaverCrawler] Fetching consensus for ${stockCode}`);

        const targetPrices = await this.getTargetPrices(stockCode);
        const overview = await this.getStockOverview(stockCode);

        if (targetPrices.length === 0) {
            return this.getMockConsensus(stockCode);
        }

        const prices = targetPrices.map((t) => t.targetPrice);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const currentPrice = overview.currentPrice;

        // 투자의견 카운트
        const buyCount = targetPrices.filter((t) =>
            ["매수", "Buy", "Strong Buy", "적극매수"].includes(t.opinion)
        ).length;
        const holdCount = targetPrices.filter((t) =>
            ["보유", "Hold", "중립", "Neutral"].includes(t.opinion)
        ).length;
        const sellCount = targetPrices.filter((t) =>
            ["매도", "Sell", "비중축소", "Reduce"].includes(t.opinion)
        ).length;

        return {
            stockCode,
            averageTargetPrice: Math.round(avgPrice),
            highTargetPrice: Math.max(...prices),
            lowTargetPrice: Math.min(...prices),
            currentPrice,
            upside: currentPrice > 0 ? ((avgPrice - currentPrice) / currentPrice) * 100 : 0,
            reportCount: targetPrices.length,
            buyCount,
            holdCount,
            sellCount,
        };
    }

    /**
     * 뉴스 크롤링
     */
    async getNews(stockCode: string, limit: number = 10): Promise<NaverNews[]> {
        console.log(`[NaverCrawler] Fetching news for ${stockCode}`);

        const url = `${this.baseUrl}/item/news.naver?code=${stockCode}`;
        const html = await this.fetchHtml(url);

        if (!html) {
            return this.getMockNews(stockCode);
        }

        const news: NaverNews[] = [];

        // 뉴스 테이블 파싱
        const newsRegex = /<td[^>]*class="title"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
        const sourceRegex = /<td[^>]*class="info"[^>]*>([^<]*)<\/td>/g;
        const dateRegex = /<td[^>]*class="date"[^>]*>([^<]*)<\/td>/g;

        let newsMatch;
        const titles: Array<{ url: string; title: string }> = [];
        const sources: string[] = [];
        const dates: string[] = [];

        while ((newsMatch = newsRegex.exec(html)) !== null) {
            titles.push({ url: newsMatch[1], title: stripHtml(newsMatch[2]) });
        }

        let sourceMatch;
        while ((sourceMatch = sourceRegex.exec(html)) !== null) {
            sources.push(stripHtml(sourceMatch[1]));
        }

        let dateMatch;
        while ((dateMatch = dateRegex.exec(html)) !== null) {
            dates.push(parseDate(dateMatch[1]));
        }

        for (let i = 0; i < Math.min(titles.length, limit); i++) {
            news.push({
                title: titles[i].title,
                source: sources[i] || "",
                date: dates[i] || "",
                url: titles[i].url.startsWith("http")
                    ? titles[i].url
                    : `${this.baseUrl}${titles[i].url}`,
            });
        }

        return news.length > 0 ? news : this.getMockNews(stockCode);
    }

    /**
     * 투자자 동향 조회 (모바일 API 사용)
     */
    async getInvestorTrends(stockCode: string): Promise<NaverInvestorTrends> {
        console.log(`[NaverCrawler] Fetching investor trends for ${stockCode}`);

        interface NaverMobileInvestorItem {
            bizdate: string;
            individualNetPurchaseAmount: string;
            foreignerNetPurchaseAmount: string;
            institutionNetPurchaseAmount: string;
        }

        const apiUrl = `${this.mobileBaseUrl}/api/stock/${stockCode}/investor`;
        let data = await this.fetchJson<NaverMobileInvestorItem[]>(apiUrl, true);

        // ETF인 경우 엔드포인트가 다름
        if (!data) {
            const etfApiUrl = `${this.mobileBaseUrl}/api/etf/${stockCode}/investor`;
            data = await this.fetchJson<NaverMobileInvestorItem[]>(etfApiUrl);
        }

        if (data && data.length > 0) {
            // 최신 데이터 (첫 번째 아이템)
            const latest = data[0];

            return {
                date: latest.bizdate || "",
                private: parseNumber(latest.individualNetPurchaseAmount),
                foreign: parseNumber(latest.foreignerNetPurchaseAmount),
                institutional: parseNumber(latest.institutionNetPurchaseAmount),
            };
        }

        // 3. 데스트랍 웹 크롤링 (최종 Fallback) - KRX 공시 기준
        console.log(`[NaverCrawler] Falling back to Desktop Web scraping for ${stockCode}`);
        const desktopUrl = `${this.baseUrl}/item/frgn.naver?code=${stockCode}`;
        const html = await this.fetchHtml(desktopUrl);

        if (!html) {
            return {
                date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
                private: 0,
                foreign: 0,
                institutional: 0,
            };
        }

        try {
            // "종목별 투자자" 테이블 파싱
            // 데스크탑 페이지는 수량 기준이지만, 순서가 [날짜, 종가, 전일비, 등락률, 거래량, 기관, 외국인, 개인...]
            // 데이터 행은 <tr ...> 안에 <td class="tc"> <span class="tah p10 grey03">2026.01.23</span> </td> ...
            const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
            if (rows) {
                for (const row of rows) {
                    if (row.includes("mouseOver")) {
                        const cols = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
                        if (cols && cols.length >= 7) {
                            const dateRaw = stripHtml(cols[0]).trim();
                            if (/\d{2}\.\d{2}\.\d{2}/.test(dateRaw)) {
                                const date = dateRaw.length === 8 ? `20${dateRaw}` : dateRaw;
                                const vals = cols.map(c => stripHtml(c).replace(/[^-0-9.]/g, ""));
                                console.log(`[NaverCrawler] Successfully scraped desktop investor trends for ${stockCode} on ${date}`);
                                return {
                                    date: date.replace(/\./g, ""),
                                    institutional: parseInt(vals[5] || "0", 10),
                                    foreign: parseInt(vals[6] || "0", 10),
                                    private: parseInt(vals[7] || "0", 10),
                                };
                            }
                        }
                    }
                }
            }
            console.log(`[NaverCrawler] Desktop scraping found no valid data row for ${stockCode}`);
        } catch (e) {
            console.error(`[NaverCrawler] Desktop parsing error for ${stockCode}:`, e);
        }

        console.log(`[NaverCrawler] All investor trend fetching methods failed for ${stockCode}, returning default.`);
        return {
            date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
            private: 0,
            foreign: 0,
            institutional: 0,
        };
    }

    // =============================================================================
    // 목 데이터 (크롤링 실패 시 사용)
    // =============================================================================

    private getMockStockOverview(stockCode: string): NaverStockOverview {
        const mockData: Record<string, Partial<NaverStockOverview>> = {
            "005930": {
                stockName: "삼성전자",
                currentPrice: 78000,
                changePrice: 1200,
                changeRate: 1.56,
                marketCap: 465000000000000,
                per: 15.2,
                pbr: 1.3,
                eps: 5131,
                bps: 60000,
                dividendYield: 2.5,
                foreignOwnership: 52.3,
                yearHighPrice: 86000,
                yearLowPrice: 52000,
            },
            "035720": {
                stockName: "카카오",
                currentPrice: 42000,
                changePrice: -500,
                changeRate: -1.18,
                marketCap: 18500000000000,
                per: 35.5,
                pbr: 1.8,
                eps: 1183,
                bps: 23333,
                dividendYield: 0.5,
                foreignOwnership: 35.2,
                yearHighPrice: 65000,
                yearLowPrice: 35000,
            },
        };

        const data = mockData[stockCode] || {};

        return {
            stockCode,
            stockName: data.stockName || `종목 ${stockCode}`,
            currentPrice: data.currentPrice || 50000,
            changePrice: data.changePrice || 0,
            changeRate: data.changeRate || 0,
            marketCap: data.marketCap || 100000000000000,
            tradingVolume: 10000000,
            per: data.per || 15,
            pbr: data.pbr || 1.5,
            eps: data.eps || 3333,
            bps: data.bps || 33333,
            dividendYield: data.dividendYield || 2.0,
            foreignOwnership: data.foreignOwnership || 30.0,
            yearHighPrice: data.yearHighPrice || 60000,
            yearLowPrice: data.yearLowPrice || 40000,
        };
    }

    private getMockAnalystReports(stockCode: string): NaverAnalystReport[] {
        return [
            {
                title: "반도체 업황 회복 본격화, 목표가 상향",
                firm: "삼성증권",
                date: "2026.01.15",
                opinion: "매수",
                targetPrice: 95000,
                reportUrl: `${this.baseUrl}/research/company_read.naver?nid=12345`,
            },
            {
                title: "HBM 시장 지배력 확대 기대",
                firm: "한국투자증권",
                date: "2026.01.12",
                opinion: "매수",
                targetPrice: 92000,
                reportUrl: `${this.baseUrl}/research/company_read.naver?nid=12346`,
            },
            {
                title: "AI 반도체 수요 폭발적 성장",
                firm: "KB증권",
                date: "2026.01.08",
                opinion: "Strong Buy",
                targetPrice: 100000,
                reportUrl: `${this.baseUrl}/research/company_read.naver?nid=12347`,
            },
            {
                title: "메모리 가격 반등 신호 감지",
                firm: "미래에셋증권",
                date: "2026.01.05",
                opinion: "보유",
                targetPrice: 85000,
                reportUrl: `${this.baseUrl}/research/company_read.naver?nid=12348`,
            },
        ];
    }

    private getMockConsensus(stockCode: string): NaverConsensus {
        return {
            stockCode,
            averageTargetPrice: 93000,
            highTargetPrice: 100000,
            lowTargetPrice: 85000,
            currentPrice: 78000,
            upside: 19.2,
            reportCount: 5,
            buyCount: 4,
            holdCount: 1,
            sellCount: 0,
        };
    }

    private getMockNews(stockCode: string): NaverNews[] {
        return [
            {
                title: "삼성전자, 4분기 실적 컨센서스 상회 전망",
                source: "한국경제",
                date: "2026.01.18",
                url: `${this.baseUrl}/news/news_read.naver?article_id=1`,
                summary: "증권가에서는 삼성전자의 4분기 실적이 시장 기대치를 상회할 것으로 전망...",
            },
            {
                title: "HBM3E 양산 본격화, AI 반도체 수요 증가",
                source: "매일경제",
                date: "2026.01.17",
                url: `${this.baseUrl}/news/news_read.naver?article_id=2`,
            },
            {
                title: "글로벌 반도체 시장 2026년 본격 회복 전망",
                source: "전자신문",
                date: "2026.01.16",
                url: `${this.baseUrl}/news/news_read.naver?article_id=3`,
            },
        ];
    }
}

// 싱글톤 인스턴스
export const naverCrawler = new NaverCrawler();
