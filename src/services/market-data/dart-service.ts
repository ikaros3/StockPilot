/**
 * DART OpenAPI 서비스
 * 금융감독원 전자공시시스템 API
 * 
 * API 문서: https://opendart.fss.or.kr/guide/main.do
 * 
 * 제공 데이터:
 * - 기업 개황 (회사명, 업종, 대표자 등)
 * - 재무제표 (재무상태표, 손익계산서 등)
 * - 공시 정보 (정기공시, 주요사항공시 등)
 */

// DART API 기본 URL
const DART_API_BASE_URL = "https://opendart.fss.or.kr/api";

// API 키 (환경 변수에서 로드)
const getApiKey = (): string => {
    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
        console.warn("DART_API_KEY 환경 변수가 설정되지 않았습니다.");
        return "";
    }
    return apiKey;
};

// =============================================================================
// 타입 정의
// =============================================================================

/** 기업 개황 */
export interface CompanyInfo {
    corpCode: string;        // 고유번호
    corpName: string;        // 회사명
    corpNameEng: string;     // 영문 회사명
    stockName: string;       // 종목명
    stockCode: string;       // 종목코드
    ceoName: string;         // 대표자명
    corpClass: string;       // 법인구분 (Y: 유가증권, K: 코스닥, N: 코넥스, E: 기타)
    jurir번호: string;       // 법인등록번호
    bizrNumber: string;      // 사업자등록번호
    address: string;         // 주소
    homepageUrl: string;     // 홈페이지
    irUrl: string;           // IR 홈페이지
    phoneNumber: string;     // 전화번호
    faxNumber: string;       // 팩스번호
    industryCode: string;    // 업종코드
    establishDate: string;   // 설립일
    accountMonth: string;    // 결산월
}

/** 재무제표 항목 */
export interface FinancialStatement {
    rcpNo: string;           // 접수번호
    reprtCode: string;       // 보고서 코드
    bsnsYear: string;        // 사업연도
    corpCode: string;        // 고유번호
    stockCode: string;       // 종목코드
    fsDiv: string;           // 개별/연결 구분 (CFS: 연결, OFS: 별도)
    fsNm: string;            // 개별/연결명
    sjDiv: string;           // 재무제표 구분 (BS: 재무상태표, IS: 손익계산서, CF: 현금흐름표)
    sjNm: string;            // 재무제표명
    accountId: string;       // 계정ID
    accountNm: string;       // 계정명
    accountDetail: string;   // 계정상세
    thstrmNm: string;        // 당기명
    thstrmAmount: number;    // 당기금액
    frmtrmNm: string;        // 전기명
    frmtrmAmount: number;    // 전기금액
    bfefrmtrmNm: string;     // 전전기명
    bfefrmtrmAmount: number; // 전전기금액
    ord: string;             // 계정과목 정렬순서
    currency: string;        // 통화
}

/** 공시 정보 */
export interface DisclosureInfo {
    corpCode: string;        // 고유번호
    corpName: string;        // 회사명
    stockCode: string;       // 종목코드
    corpClass: string;       // 법인구분
    reportName: string;      // 보고서명
    rcpNo: string;           // 접수번호
    filingAgent: string;     // 공시 제출인명
    rcpDate: string;         // 접수일자
    remark: string;          // 비고
}

/** 주요 재무 비율 */
export interface FinancialRatios {
    per: number;             // PER
    pbr: number;             // PBR
    eps: number;             // EPS
    bps: number;             // BPS
    roe: number;             // ROE
    roa: number;             // ROA
    debtRatio: number;       // 부채비율
    currentRatio: number;    // 유동비율
}

/** DART API 응답 */
interface DartApiResponse<T> {
    status: string;          // 에러코드 (000: 정상)
    message: string;         // 에러메시지
    list?: T[];
}

// =============================================================================
// DART OpenAPI 서비스 클래스
// =============================================================================

export class DartService {
    constructor() {
        // 생성자에서는 아무것도 하지 않음 (환경 변수 지연 로드)
    }

    /**
     * API 키 동적 로드
     */
    private getApiKey(): string {
        const apiKey = process.env.DART_API_KEY;
        if (!apiKey) {
            console.warn("DART_API_KEY 환경 변수가 설정되지 않았습니다.");
            return "";
        }
        return apiKey;
    }

    /**
     * API 호출 헬퍼 메서드
     */
    private async callApi<T>(
        endpoint: string,
        params: Record<string, string>
    ): Promise<T[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.warn("DART API 키가 설정되지 않아 목 데이터를 반환합니다.");
            return [];
        }

        const queryParams = new URLSearchParams({
            crtfc_key: apiKey,
            ...params,
        });

        const url = `${DART_API_BASE_URL}/${endpoint}.json?${queryParams}`;

        try {
            const response = await fetch(url);
            const data: DartApiResponse<T> = await response.json();

            if (data.status !== "000") {
                console.error(`DART API 오류: ${data.message}`);
                return [];
            }

            return data.list || [];
        } catch (error) {
            console.error("DART API 호출 실패:", error);
            return [];
        }
    }

    /**
     * 종목코드로 고유번호 조회
     * DART는 고유번호(corp_code)를 사용하므로 종목코드로 변환 필요
     */
    async getCorpCode(stockCode: string): Promise<string | null> {
        // 실제 구현에서는 corp_code.xml 파일을 다운로드하여 매핑 테이블을 구축해야 함
        // 여기서는 주요 종목에 대한 매핑만 제공
        const corpCodeMap: Record<string, string> = {
            "005930": "00126380", // 삼성전자
            "000660": "00164779", // SK하이닉스
            "035720": "00258801", // 카카오
            "005380": "00164742", // 현대차
            "035420": "00401731", // NAVER
            "051910": "00145057", // LG화학
            "006400": "00155286", // 삼성SDI
            "207940": "00969459", // 삼성바이오로직스
            "068270": "00375123", // 셀트리온
            "105560": "00401735", // KB금융
        };

        return corpCodeMap[stockCode] || null;
    }

    /**
     * 기업 개황 조회
     */
    async getCompanyInfo(stockCode: string): Promise<CompanyInfo | null> {
        const corpCode = await this.getCorpCode(stockCode);

        if (!corpCode) {
            console.warn(`종목코드 ${stockCode}에 대한 고유번호를 찾을 수 없습니다.`);
            return this.getMockCompanyInfo(stockCode);
        }

        const result = await this.callApi<Record<string, string>>("company", {
            corp_code: corpCode,
        });

        if (result.length === 0) {
            return this.getMockCompanyInfo(stockCode);
        }

        const data = result[0];
        return {
            corpCode: data.corp_code,
            corpName: data.corp_name,
            corpNameEng: data.corp_name_eng,
            stockName: data.stock_name,
            stockCode: data.stock_code,
            ceoName: data.ceo_nm,
            corpClass: data.corp_cls,
            jurir번호: data.jurir_no,
            bizrNumber: data.bizr_no,
            address: data.adres,
            homepageUrl: data.hm_url,
            irUrl: data.ir_url,
            phoneNumber: data.phn_no,
            faxNumber: data.fax_no,
            industryCode: data.induty_code,
            establishDate: data.est_dt,
            accountMonth: data.acc_mt,
        };
    }

    /**
     * 재무제표 조회
     */
    async getFinancialStatements(
        stockCode: string,
        year: string,
        reportCode: "11011" | "11012" | "11013" | "11014" = "11011" // 11011: 사업보고서
    ): Promise<FinancialStatement[]> {
        const corpCode = await this.getCorpCode(stockCode);

        if (!corpCode || !this.getApiKey()) {
            return this.getMockFinancialStatements(stockCode, year);
        }

        const result = await this.callApi<Record<string, string>>("fnlttSinglAcntAll", {
            corp_code: corpCode,
            bsns_year: year,
            reprt_code: reportCode,
            fs_div: "CFS", // 연결재무제표
        });

        return result.map((item) => ({
            rcpNo: item.rcept_no,
            reprtCode: item.reprt_code,
            bsnsYear: item.bsns_year,
            corpCode: item.corp_code,
            stockCode: stockCode,
            fsDiv: item.fs_div,
            fsNm: item.fs_nm,
            sjDiv: item.sj_div,
            sjNm: item.sj_nm,
            accountId: item.account_id,
            accountNm: item.account_nm,
            accountDetail: item.account_detail,
            thstrmNm: item.thstrm_nm,
            thstrmAmount: this.parseAmount(item.thstrm_amount),
            frmtrmNm: item.frmtrm_nm,
            frmtrmAmount: this.parseAmount(item.frmtrm_amount),
            bfefrmtrmNm: item.bfefrmtrm_nm,
            bfefrmtrmAmount: this.parseAmount(item.bfefrmtrm_amount),
            ord: item.ord,
            currency: item.currency || "KRW",
        }));
    }

    /**
     * 공시 정보 조회
     */
    async getDisclosures(
        stockCode: string,
        startDate?: string,
        endDate?: string
    ): Promise<DisclosureInfo[]> {
        const corpCode = await this.getCorpCode(stockCode);

        if (!corpCode || !this.getApiKey()) {
            return this.getMockDisclosures(stockCode);
        }

        const today = new Date();
        const params: Record<string, string> = {
            corp_code: corpCode,
            bgn_de: startDate || this.formatDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)),
            end_de: endDate || this.formatDate(today),
            page_count: "100",
        };

        const result = await this.callApi<Record<string, string>>("list", params);

        return result.map((item) => ({
            corpCode: item.corp_code,
            corpName: item.corp_name,
            stockCode: item.stock_code,
            corpClass: item.corp_cls,
            reportName: item.report_nm,
            rcpNo: item.rcept_no,
            filingAgent: item.flr_nm,
            rcpDate: item.rcept_dt,
            remark: item.rm,
        }));
    }

    /**
     * 주요 재무 비율 계산
     */
    async getFinancialRatios(
        stockCode: string,
        currentPrice: number
    ): Promise<FinancialRatios> {
        const year = new Date().getFullYear().toString();
        const statements = await this.getFinancialStatements(stockCode, year);

        if (statements.length === 0) {
            return this.getMockFinancialRatios();
        }

        // 재무제표에서 필요한 항목 추출
        const findAccount = (keyword: string): number => {
            const account = statements.find((s) =>
                s.accountNm.includes(keyword)
            );
            return account?.thstrmAmount || 0;
        };

        const 당기순이익 = findAccount("당기순이익");
        const 자본총계 = findAccount("자본총계") || findAccount("자본");
        const 부채총계 = findAccount("부채총계") || findAccount("부채");
        const 자산총계 = findAccount("자산총계") || findAccount("자산");
        const 유동자산 = findAccount("유동자산");
        const 유동부채 = findAccount("유동부채");
        const 발행주식수 = 1000000; // 임시값 (별도 API 호출 필요)

        const eps = 당기순이익 / 발행주식수;
        const bps = 자본총계 / 발행주식수;

        return {
            per: currentPrice / eps || 0,
            pbr: currentPrice / bps || 0,
            eps,
            bps,
            roe: (당기순이익 / 자본총계) * 100 || 0,
            roa: (당기순이익 / 자산총계) * 100 || 0,
            debtRatio: (부채총계 / 자본총계) * 100 || 0,
            currentRatio: (유동자산 / 유동부채) * 100 || 0,
        };
    }

    // =============================================================================
    // 유틸리티 메서드
    // =============================================================================

    private parseAmount(value: string): number {
        if (!value) return 0;
        return parseInt(value.replace(/,/g, ""), 10) || 0;
    }

    private formatDate(date: Date): string {
        return date.toISOString().slice(0, 10).replace(/-/g, "");
    }

    // =============================================================================
    // 목 데이터 (API 키 미설정 시 사용)
    // =============================================================================

    private getMockCompanyInfo(stockCode: string): CompanyInfo {
        const mockData: Record<string, Partial<CompanyInfo>> = {
            "005930": {
                corpName: "삼성전자",
                corpNameEng: "SAMSUNG ELECTRONICS CO.,LTD",
                stockName: "삼성전자",
                ceoName: "한종희, 경계현",
                industryCode: "264",
                address: "경기도 수원시 영통구 삼성로 129",
                homepageUrl: "https://www.samsung.com/sec/",
            },
            "035720": {
                corpName: "카카오",
                corpNameEng: "Kakao Corp.",
                stockName: "카카오",
                ceoName: "정신아",
                industryCode: "722",
                address: "제주특별자치도 제주시 첨단로 242",
                homepageUrl: "https://www.kakaocorp.com",
            },
        };

        const data = mockData[stockCode] || {};

        return {
            corpCode: "",
            corpName: data.corpName || `종목 ${stockCode}`,
            corpNameEng: data.corpNameEng || "",
            stockName: data.stockName || `종목 ${stockCode}`,
            stockCode,
            ceoName: data.ceoName || "",
            corpClass: "Y",
            jurir번호: "",
            bizrNumber: "",
            address: data.address || "",
            homepageUrl: data.homepageUrl || "",
            irUrl: "",
            phoneNumber: "",
            faxNumber: "",
            industryCode: data.industryCode || "",
            establishDate: "",
            accountMonth: "12",
        };
    }

    private getMockFinancialStatements(stockCode: string, year: string): FinancialStatement[] {
        // 삼성전자 기준 목 데이터
        return [
            {
                rcpNo: "20240314000123",
                reprtCode: "11011",
                bsnsYear: year,
                corpCode: "",
                stockCode,
                fsDiv: "CFS",
                fsNm: "연결재무제표",
                sjDiv: "IS",
                sjNm: "손익계산서",
                accountId: "ifrs-full_ProfitLoss",
                accountNm: "당기순이익",
                accountDetail: "",
                thstrmNm: "제55기",
                thstrmAmount: 15000000000000,
                frmtrmNm: "제54기",
                frmtrmAmount: 39000000000000,
                bfefrmtrmNm: "제53기",
                bfefrmtrmAmount: 23000000000000,
                ord: "1",
                currency: "KRW",
            },
            {
                rcpNo: "20240314000123",
                reprtCode: "11011",
                bsnsYear: year,
                corpCode: "",
                stockCode,
                fsDiv: "CFS",
                fsNm: "연결재무제표",
                sjDiv: "BS",
                sjNm: "재무상태표",
                accountId: "ifrs-full_Equity",
                accountNm: "자본총계",
                accountDetail: "",
                thstrmNm: "제55기",
                thstrmAmount: 360000000000000,
                frmtrmNm: "제54기",
                frmtrmAmount: 350000000000000,
                bfefrmtrmNm: "제53기",
                bfefrmtrmAmount: 340000000000000,
                ord: "2",
                currency: "KRW",
            },
        ];
    }

    private getMockDisclosures(stockCode: string): DisclosureInfo[] {
        return [
            {
                corpCode: "",
                corpName: stockCode === "005930" ? "삼성전자" : `종목 ${stockCode}`,
                stockCode,
                corpClass: "Y",
                reportName: "분기보고서 (2024.03)",
                rcpNo: "20240515000123",
                filingAgent: "삼성전자(주)",
                rcpDate: "20240515",
                remark: "",
            },
            {
                corpCode: "",
                corpName: stockCode === "005930" ? "삼성전자" : `종목 ${stockCode}`,
                stockCode,
                corpClass: "Y",
                reportName: "주요사항보고서(자기주식취득결정)",
                rcpNo: "20240430000456",
                filingAgent: "삼성전자(주)",
                rcpDate: "20240430",
                remark: "",
            },
        ];
    }

    private getMockFinancialRatios(): FinancialRatios {
        return {
            per: 15.2,
            pbr: 1.3,
            eps: 5200,
            bps: 60000,
            roe: 8.7,
            roa: 4.2,
            debtRatio: 35.5,
            currentRatio: 180.2,
        };
    }
}

// 싱글톤 인스턴스
export const dartService = new DartService();
