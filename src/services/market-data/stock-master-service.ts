
// StockMasterService
// 전 종목 마스터 데이터 관리 (종목코드 <-> 고유번호 매핑)

interface StockMaster {
    stockCode: string;
    corpCode: string;
    corpName: string;
}

// 주요 종목 매핑 (초기 하드코딩 데이터 - 추후 전체 데이터로 대체 필요)
const INITIAL_MASTER_DATA: StockMaster[] = [
    { stockCode: "005930", corpCode: "00126380", corpName: "삼성전자" },
    { stockCode: "000660", corpCode: "00164779", corpName: "SK하이닉스" },
    { stockCode: "035720", corpCode: "00258801", corpName: "카카오" },
    { stockCode: "005380", corpCode: "00164742", corpName: "현대차" },
    { stockCode: "035420", corpCode: "00401731", corpName: "NAVER" },
    { stockCode: "051910", corpCode: "00145057", corpName: "LG화학" },
    { stockCode: "006400", corpCode: "00155286", corpName: "삼성SDI" },
    { stockCode: "207940", corpCode: "00969459", corpName: "삼성바이오로직스" },
    { stockCode: "068270", corpCode: "00375123", corpName: "셀트리온" },
    { stockCode: "105560", corpCode: "00401735", corpName: "KB금융" },
    { stockCode: "000270", corpCode: "00106641", corpName: "기아" },
    { stockCode: "005490", corpCode: "00149655", corpName: "POSCO홀딩스" },
    { stockCode: "032830", corpCode: "00365387", corpName: "삼성생명" },
    { stockCode: "012330", corpCode: "00113058", corpName: "현대모비스" },
    { stockCode: "055550", corpCode: "00260455", corpName: "신한지주" },
    { stockCode: "028260", corpCode: "00877059", corpName: "삼성물산" },
    { stockCode: "015760", corpCode: "00159219", corpName: "한국전력" },
    { stockCode: "034730", corpCode: "00356361", corpName: "SK" },
    { stockCode: "017670", corpCode: "00174828", corpName: "SK텔레콤" },
    { stockCode: "096770", corpCode: "00650995", corpName: "SK이노베이션" },
];

export class StockMasterService {
    private masterMap: Map<string, string> = new Map();

    constructor() {
        // 초기 데이터 로드
        this.loadInitialData();
    }

    private loadInitialData() {
        INITIAL_MASTER_DATA.forEach(data => {
            this.masterMap.set(data.stockCode, data.corpCode);
        });
    }

    /**
     * 종목코드로 고유번호(corp_code) 조회
     */
    getCorpCode(stockCode: string): string | null {
        return this.masterMap.get(stockCode) || null;
    }

    /**
     * 전체 마스터 데이터 동기화 (추후 구현)
     * DART에서 전체 XML 다운로드 후 파싱하여 저장
     */
    async syncMasterData(): Promise<void> {
        console.log("Starting master data synchronization...");
        // TODO: Implement full XML download and parsing logic
        // Requires 'adm-zip' and 'xml2js' libraries
        // const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${process.env.DART_API_KEY}`;
    }
}

export const stockMasterService = new StockMasterService();
