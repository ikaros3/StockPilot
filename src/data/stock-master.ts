/**
 * 주식 종목 마스터 데이터
 * 
 * 코스피, 코스닥, ETF 전체 종목 정보
 * 실제 운영 시에는 KIS API의 종목정보파일(mst)을 정기적으로 다운로드하여 갱신해야 합니다.
 * 
 * 데이터 출처: 한국거래소(KRX)
 * 갱신 주기: 매일 (영업일 기준)
 */

export interface StockInfo {
    code: string;       // 종목코드 (6자리)
    name: string;       // 종목명
    market: "KOSPI" | "KOSDAQ" | "ETF" | "ETN" | "ELW" | "KONEX";
    sector?: string;    // 업종
}

// 주요 코스피 종목
const KOSPI_STOCKS: StockInfo[] = [
    { code: "005930", name: "삼성전자", market: "KOSPI", sector: "전기전자" },
    { code: "000660", name: "SK하이닉스", market: "KOSPI", sector: "전기전자" },
    { code: "005380", name: "현대차", market: "KOSPI", sector: "운수장비" },
    { code: "000270", name: "기아", market: "KOSPI", sector: "운수장비" },
    { code: "005490", name: "POSCO홀딩스", market: "KOSPI", sector: "철강금속" },
    { code: "035420", name: "NAVER", market: "KOSPI", sector: "서비스업" },
    { code: "051910", name: "LG화학", market: "KOSPI", sector: "화학" },
    { code: "006400", name: "삼성SDI", market: "KOSPI", sector: "전기전자" },
    { code: "207940", name: "삼성바이오로직스", market: "KOSPI", sector: "의약품" },
    { code: "373220", name: "LG에너지솔루션", market: "KOSPI", sector: "전기전자" },
    { code: "105560", name: "KB금융", market: "KOSPI", sector: "기타금융" },
    { code: "055550", name: "신한지주", market: "KOSPI", sector: "기타금융" },
    { code: "012330", name: "현대모비스", market: "KOSPI", sector: "운수장비" },
    { code: "066570", name: "LG전자", market: "KOSPI", sector: "전기전자" },
    { code: "003670", name: "포스코퓨처엠", market: "KOSPI", sector: "철강금속" },
    { code: "028260", name: "삼성물산", market: "KOSPI", sector: "유통업" },
    { code: "034730", name: "SK", market: "KOSPI", sector: "기타금융" },
    { code: "096770", name: "SK이노베이션", market: "KOSPI", sector: "화학" },
    { code: "003550", name: "LG", market: "KOSPI", sector: "기타금융" },
    { code: "086790", name: "하나금융지주", market: "KOSPI", sector: "기타금융" },
    { code: "010130", name: "고려아연", market: "KOSPI", sector: "비금속광물" },
    { code: "032830", name: "삼성생명", market: "KOSPI", sector: "보험" },
    { code: "033780", name: "KT&G", market: "KOSPI", sector: "음식료품" },
    { code: "011200", name: "HMM", market: "KOSPI", sector: "운수창고" },
    { code: "015760", name: "한국전력", market: "KOSPI", sector: "전기가스" },
    { code: "035720", name: "카카오", market: "KOSPI", sector: "서비스업" },
    { code: "000810", name: "삼성화재", market: "KOSPI", sector: "보험" },
    { code: "017670", name: "SK텔레콤", market: "KOSPI", sector: "통신업" },
    { code: "018260", name: "삼성에스디에스", market: "KOSPI", sector: "서비스업" },
    { code: "030200", name: "KT", market: "KOSPI", sector: "통신업" },
    { code: "009150", name: "삼성전기", market: "KOSPI", sector: "전기전자" },
    { code: "010950", name: "S-Oil", market: "KOSPI", sector: "화학" },
    { code: "024110", name: "기업은행", market: "KOSPI", sector: "은행" },
    { code: "316140", name: "우리금융지주", market: "KOSPI", sector: "기타금융" },
    { code: "011170", name: "롯데케미칼", market: "KOSPI", sector: "화학" },
    { code: "034020", name: "두산에너빌리티", market: "KOSPI", sector: "기계" },
    { code: "000720", name: "현대건설", market: "KOSPI", sector: "건설업" },
    { code: "036570", name: "엔씨소프트", market: "KOSPI", sector: "서비스업" },
    { code: "047050", name: "포스코인터내셔널", market: "KOSPI", sector: "유통업" },
    { code: "326030", name: "SK바이오팜", market: "KOSPI", sector: "의약품" },
];

// 주요 코스닥 종목
const KOSDAQ_STOCKS: StockInfo[] = [
    { code: "247540", name: "에코프로비엠", market: "KOSDAQ", sector: "화학" },
    { code: "086520", name: "에코프로", market: "KOSDAQ", sector: "화학" },
    { code: "091990", name: "셀트리온헬스케어", market: "KOSDAQ", sector: "유통" },
    { code: "068270", name: "셀트리온", market: "KOSDAQ", sector: "의료·정밀기기" },
    { code: "196170", name: "알테오젠", market: "KOSDAQ", sector: "제약" },
    { code: "293490", name: "카카오게임즈", market: "KOSDAQ", sector: "디지털콘텐츠" },
    { code: "263750", name: "펄어비스", market: "KOSDAQ", sector: "디지털콘텐츠" },
    { code: "035900", name: "JYP Ent.", market: "KOSDAQ", sector: "오락·문화" },
    { code: "352820", name: "하이브", market: "KOSDAQ", sector: "오락·문화" },
    { code: "112040", name: "위메이드", market: "KOSDAQ", sector: "디지털콘텐츠" },
    { code: "145020", name: "휴젤", market: "KOSDAQ", sector: "제약" },
    { code: "328130", name: "루닛", market: "KOSDAQ", sector: "IT서비스" },
    { code: "403870", name: "HPSP", market: "KOSDAQ", sector: "반도체" },
    { code: "035760", name: "CJ ENM", market: "KOSDAQ", sector: "방송서비스" },
    { code: "095340", name: "ISC", market: "KOSDAQ", sector: "반도체" },
    { code: "041510", name: "에스엠", market: "KOSDAQ", sector: "오락·문화" },
    { code: "251270", name: "넷마블", market: "KOSDAQ", sector: "디지털콘텐츠" },
    { code: "039030", name: "이오테크닉스", market: "KOSDAQ", sector: "반도체" },
    { code: "240810", name: "원익IPS", market: "KOSDAQ", sector: "반도체" },
    { code: "357780", name: "솔브레인", market: "KOSDAQ", sector: "화학" },
    { code: "067310", name: "하나마이크론", market: "KOSDAQ", sector: "반도체" },
    { code: "141080", name: "레고켐바이오", market: "KOSDAQ", sector: "제약" },
    { code: "214150", name: "클래시스", market: "KOSDAQ", sector: "의료·정밀기기" },
    { code: "236810", name: "엔비티", market: "KOSDAQ", sector: "IT서비스" },
    { code: "383310", name: "에코프로에이치엔", market: "KOSDAQ", sector: "화학" },
];

// 주요 ETF 상품
const ETF_STOCKS: StockInfo[] = [
    // 국내 지수 추종
    { code: "069500", name: "KODEX 200", market: "ETF" },
    { code: "102110", name: "TIGER 200", market: "ETF" },
    { code: "229200", name: "KODEX 코스닥150", market: "ETF" },
    { code: "252670", name: "KODEX 200선물인버스2X", market: "ETF" },
    { code: "122630", name: "KODEX 레버리지", market: "ETF" },
    { code: "114800", name: "KODEX 인버스", market: "ETF" },
    { code: "251340", name: "KODEX 코스닥150선물인버스", market: "ETF" },
    { code: "233740", name: "KODEX 코스닥150레버리지", market: "ETF" },
    { code: "278530", name: "KODEX 코스닥150인버스", market: "ETF" },
    { code: "102780", name: "KODEX 삼성그룹", market: "ETF" },

    // 섹터/테마 ETF
    { code: "091160", name: "KODEX 반도체", market: "ETF" },
    { code: "091170", name: "KODEX 은행", market: "ETF" },
    { code: "117700", name: "KODEX 건설", market: "ETF" },
    { code: "140710", name: "KODEX 운송", market: "ETF" },
    { code: "266360", name: "KODEX 2차전지산업", market: "ETF" },
    { code: "305540", name: "TIGER 2차전지테마", market: "ETF" },
    { code: "364980", name: "TIGER K반도체", market: "ETF" },
    { code: "091180", name: "KODEX 자동차", market: "ETF" },
    { code: "139260", name: "TIGER 200 에너지화학", market: "ETF" },
    { code: "139280", name: "TIGER 200 IT", market: "ETF" },

    // 해외 지수 추종
    { code: "143850", name: "TIGER 미국S&P500", market: "ETF" },
    { code: "381180", name: "TIGER 미국나스닥100", market: "ETF" },
    { code: "379800", name: "KODEX 미국S&P500TR", market: "ETF" },
    { code: "379810", name: "KODEX 미국나스닥100TR", market: "ETF" },
    { code: "133690", name: "TIGER 미국나스닥100", market: "ETF" },
    { code: "360750", name: "TIGER 미국S&P500레버리지(합성)", market: "ETF" },
    { code: "371460", name: "TIGER 차이나전기차SOLACTIVE", market: "ETF" },
    { code: "245710", name: "KINDEX 일본Nikkei225(H)", market: "ETF" },

    // 채권/배당/금리
    { code: "148070", name: "KOSEF 국고채10년", market: "ETF" },
    { code: "152380", name: "KODEX 국채선물10년인버스", market: "ETF" },
    { code: "211560", name: "KODEX 200고배당", market: "ETF" },
    { code: "458760", name: "KODEX 머드서티 배당가치", market: "ETF" },

    // 원자재/금
    { code: "132030", name: "KODEX 골드선물(H)", market: "ETF" },
    { code: "130680", name: "TIGER 원유선물Enhanced(H)", market: "ETF" },
    { code: "261220", name: "KODEX WTI원유선물(H)", market: "ETF" },
];

// 전체 종목 리스트
export const ALL_STOCKS: StockInfo[] = [
    ...KOSPI_STOCKS,
    ...KOSDAQ_STOCKS,
    ...ETF_STOCKS,
];

/**
 * 종목 검색 함수
 * @param query 검색어 (종목명 또는 종목코드)
 * @param options 검색 옵션
 * @returns 검색 결과
 */
export function searchStocks(
    query: string,
    options?: {
        market?: ("KOSPI" | "KOSDAQ" | "ETF")[];
        limit?: number;
    }
): StockInfo[] {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
        return [];
    }

    let results = ALL_STOCKS.filter((stock) => {
        // 마켓 필터
        if (options?.market && !options.market.includes(stock.market as "KOSPI" | "KOSDAQ" | "ETF")) {
            return false;
        }

        // 종목코드 또는 종목명으로 검색
        return (
            stock.code.includes(trimmedQuery) ||
            stock.name.toLowerCase().includes(trimmedQuery)
        );
    });

    // 정렬: 정확도 높은 순서
    results.sort((a, b) => {
        // 코드가 정확히 일치하면 최우선
        if (a.code === trimmedQuery) return -1;
        if (b.code === trimmedQuery) return 1;

        // 이름이 검색어로 시작하면 우선
        const aStartsWith = a.name.toLowerCase().startsWith(trimmedQuery);
        const bStartsWith = b.name.toLowerCase().startsWith(trimmedQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // 코드가 검색어로 시작하면 우선
        const aCodeStarts = a.code.startsWith(trimmedQuery);
        const bCodeStarts = b.code.startsWith(trimmedQuery);
        if (aCodeStarts && !bCodeStarts) return -1;
        if (!aCodeStarts && bCodeStarts) return 1;

        return 0;
    });

    // 결과 수 제한
    if (options?.limit) {
        results = results.slice(0, options.limit);
    }

    return results;
}

/**
 * 종목코드로 종목 정보 조회
 */
export function getStockByCode(code: string): StockInfo | undefined {
    return ALL_STOCKS.find((stock) => stock.code === code);
}

/**
 * 마켓별 종목 수 조회
 */
export function getStockCounts(): Record<string, number> {
    return {
        KOSPI: KOSPI_STOCKS.length,
        KOSDAQ: KOSDAQ_STOCKS.length,
        ETF: ETF_STOCKS.length,
        total: ALL_STOCKS.length,
    };
}
