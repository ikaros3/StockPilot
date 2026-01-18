# StockPilot 상세 구현 계획

> **개인 투자자용 포트폴리오 분석 및 리포팅 플랫폼**
> 
> 전문 리서치 리포트 수준의 분석 결과를 제공하는 웹 애플리케이션

---

## User Review Required

### ✅ 기술 스택 결정 완료

| 항목 | 선택 | 이유 |
|------|------|------|
| **UI 프레임워크** | shadcn/ui | 개발 속도, 일관된 디자인, 커스터마이징 용이 |
| **차트 라이브러리** | Recharts + TradingView Lightweight | 대시보드 차트(Recharts) + 주가 캔들 차트(TradingView) |
| **상태관리** | Zustand | 간단한 API, 미들웨어 지원, 넓은 생태계 |

### ✅ 데이터 소스 정책

> [!IMPORTANT]
> **KB증권 OpenAPI**: 기업/핀테크 파트너십 위주로 개인 투자자 직접 사용 불가

| 데이터 종류 | 소스 | 비용 | 비고 |
|------------|------|------|------|
| **주가 데이터** | 증권사 OpenAPI (아래 옵션 중 택1) | 무료 | 계좌 개설 필요 |
| **보조 주가 데이터** | 토스증권 크롤링 | 무료 | |
| **공시 데이터** | DART OpenAPI | 무료 | |
| **애널리스트 리포트** | 네이버 금융 + 세이브로 크롤링 | 무료 | 공개 데이터 |

#### 🏦 증권사 OpenAPI 비교 (개인 투자자 무료 사용 가능)

| 증권사 | API 방식 | OS 지원 | 특징 |
|--------|----------|---------|------|
| **한국투자증권** | REST + WebSocket | Windows/Mac/Linux | 해외 주식 지원, 개발자센터 우수 |
| **키움증권** | OCX (COM) | Windows 전용 | 풍부한 커뮤니티, 조건 검색 |
| **이베스트투자증권** | REST + DLL/COM | Windows/Mac/Linux | REST API로 개발 유연성 |
| **대신증권** | COM Object | Windows 전용 | 빠른 응답 속도, 안정성 |

> [!TIP]
> **선택 완료**: **한국투자증권 OpenAPI** (계좌 추후 개설)
> - 초기 개발: 토스증권 크롤링으로 시작
> - 이후: 한국투자증권 계좌 개설 후 실시간 API 연동

> [!TIP]
> **토스증권 크롤링 URL 패턴**
> ```
> https://www.tossinvest.com/stocks/[종목코드]/order
> 예) https://www.tossinvest.com/stocks/A122630/order (Kodex 레버리지)
> ```

---

## Proposed Changes

### Phase 1: 프로젝트 초기화 및 기본 설정

---

#### [NEW] [package.json](file:///d:/Project/Github/StockPilot/package.json)

Next.js 15 기반 프로젝트 의존성 정의:

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "firebase": "^11.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.15.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0",
    "@hookform/resolvers": "^3.9.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.469.0"
  }
}
```

---

#### [NEW] [tailwind.config.ts](file:///d:/Project/Github/StockPilot/tailwind.config.ts)

Tailwind CSS v4 설정 및 커스텀 테마:

- 투자 관련 색상 팔레트 (한국 시장 스타일: 수익=빨강 🔴, 손실=파랑 🔵)
- 다크모드 지원
- 커스텀 컴포넌트 스타일

---

#### [NEW] [firebase.json](file:///d:/Project/Github/StockPilot/firebase.json)

Firebase Hosting 및 Firestore 설정

---

#### [NEW] [.github/workflows/firebase-deploy.yml](file:///d:/Project/Github/StockPilot/.github/workflows/firebase-deploy.yml)

GitHub Actions CI/CD 파이프라인:

```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [main]
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```

---

### Phase 2: Firebase 인프라 구축

---

#### [NEW] [src/lib/firebase/config.ts](file:///d:/Project/Github/StockPilot/src/lib/firebase/config.ts)

Firebase 앱 초기화 및 서비스 인스턴스 생성

```typescript
// Firebase 앱 초기화
// Firestore, Auth 인스턴스 export
```

---

#### [NEW] [src/lib/firebase/auth.ts](file:///d:/Project/Github/StockPilot/src/lib/firebase/auth.ts)

인증 관련 유틸리티 함수:

- `signInWithGoogle()` - Google 로그인
- `signInWithEmail()` - 이메일/비밀번호 로그인
- `signUp()` - 회원가입
- `signOut()` - 로그아웃
- `useAuth()` - 인증 상태 훅

---

#### [NEW] [src/lib/firebase/firestore.ts](file:///d:/Project/Github/StockPilot/src/lib/firebase/firestore.ts)

Firestore CRUD 유틸리티:

- 컬렉션 참조
- 문서 생성/읽기/수정/삭제 헬퍼
- 실시간 구독 헬퍼

---

#### [NEW] [firestore.rules](file:///d:/Project/Github/StockPilot/firestore.rules)

Firestore 보안 규칙:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 본인 데이터만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /portfolios/{portfolioId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

### Phase 3: 타입 정의 및 스키마

---

#### [NEW] [src/types/user.ts](file:///d:/Project/Github/StockPilot/src/types/user.ts)

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  investmentStyle: 'aggressive' | 'moderate' | 'conservative';
  investmentHorizon: 'short' | 'medium' | 'long';
  targetReturn: number;  // 목표 수익률 (%)
  maxLoss: number;       // 허용 손실률 (%)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### [NEW] [src/types/portfolio.ts](file:///d:/Project/Github/StockPilot/src/types/portfolio.ts)

```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Holding {
  id: string;
  portfolioId: string;
  stockCode: string;
  stockName: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: Timestamp;
  additionalPurchases: AdditionalPurchase[];
}

interface AdditionalPurchase {
  price: number;
  quantity: number;
  date: Timestamp;
}
```

---

#### [NEW] [src/types/analysis.ts](file:///d:/Project/Github/StockPilot/src/types/analysis.ts)

```typescript
interface AnalysisReport {
  id: string;
  holdingId: string;
  summary: SummaryAnalysis;
  exitTiming: ExitTimingAnalysis;
  accumulation: AccumulationAnalysis;
  riskControl: RiskControlAnalysis;
  tradingStrategy: TradingStrategyAnalysis;
  holdingPeriod: HoldingPeriodAnalysis;
  analystInsight: AnalystInsightAnalysis;
  finalVerdict: FinalVerdictAnalysis;
  generatedAt: Timestamp;
}

interface SummaryAnalysis {
  performanceText: string;      // 현재 성과 평가 문장
  targetProgress: number;       // 목표가 대비 진행률 (%)
  stockCharacteristics: {
    businessStructure: string;
    industryPosition: string;
    dividendPolicy: string;
  };
  valuationStatus: string;
  portfolioWeight: number;
}

// ... 추가 분석 타입들
```

---

### Phase 4: 공통 UI 컴포넌트 (shadcn/ui 기반)

---

#### [NEW] [src/components/ui/button.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/button.tsx)

shadcn/ui Button 컴포넌트 (variants: default, destructive, outline, ghost)

---

#### [NEW] [src/components/ui/card.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/card.tsx)

Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

---

#### [NEW] [src/components/ui/badge.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/badge.tsx)

성과 상태 배지 (강세/중립/약세, 수익/손실)

---

#### [NEW] [src/components/ui/tabs.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/tabs.tsx)

분석 탭 네비게이션용 Tabs 컴포넌트

---

#### [NEW] [src/components/ui/input.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/input.tsx)
#### [NEW] [src/components/ui/select.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/select.tsx)
#### [NEW] [src/components/ui/dialog.tsx](file:///d:/Project/Github/StockPilot/src/components/ui/dialog.tsx)

폼 입력 및 모달 컴포넌트

---

### Phase 5: 레이아웃 컴포넌트

---

#### [NEW] [src/components/layout/Header.tsx](file:///d:/Project/Github/StockPilot/src/components/layout/Header.tsx)

상단 네비게이션 바:
- 로고
- 메인 네비게이션 (대시보드, 리포트, 설정)
- 사용자 프로필 드롭다운

---

#### [NEW] [src/components/layout/Sidebar.tsx](file:///d:/Project/Github/StockPilot/src/components/layout/Sidebar.tsx)

사이드바 메뉴:
- 포트폴리오 목록
- 빠른 종목 검색
- 알림 센터

---

#### [NEW] [src/app/layout.tsx](file:///d:/Project/Github/StockPilot/src/app/layout.tsx)

루트 레이아웃:
- 폰트 설정
- 메타데이터
- Provider 래핑 (QueryClient, AuthProvider)

---

#### [NEW] [src/app/(dashboard)/layout.tsx](file:///d:/Project/Github/StockPilot/src/app/(dashboard)/layout.tsx)

대시보드 레이아웃:
- Header + Sidebar + Main Content 구조
- 인증 체크

---

### Phase 6: 포트폴리오 요약 대시보드

---

#### [NEW] [src/app/(dashboard)/page.tsx](file:///d:/Project/Github/StockPilot/src/app/(dashboard)/page.tsx)

메인 대시보드 페이지:
- 포트폴리오 요약 카드
- 종목 카드 그리드
- 최근 알림

---

#### [NEW] [src/components/cards/PortfolioSummaryCard.tsx](file:///d:/Project/Github/StockPilot/src/components/cards/PortfolioSummaryCard.tsx)

포트폴리오 요약 카드:
```
┌─────────────────────────────────────────┐
│ 총 투자액: ₩10,000,000                   │
│ 현재 평가액: ₩12,500,000                 │
│ 총 수익: ₩2,500,000 (+25.0%)  🟢 매우 우수│
│ 보유 종목: 5개                           │
└─────────────────────────────────────────┘
```

---

#### [NEW] [src/components/cards/StockCard.tsx](file:///d:/Project/Github/StockPilot/src/components/cards/StockCard.tsx)

종목 카드:
```
┌─────────────────────────────────────────┐
│ 삼성전자 (005930)              🟢 강세   │
│ 현재가: ₩78,000                         │
│ 매수가: ₩65,000 | 수량: 100주            │
│ 평가금액: ₩7,800,000                    │
│ 수익: ₩1,300,000 (+20.0%)               │
│                        [상세 분석 보기]  │
└─────────────────────────────────────────┘
```

---

### Phase 7: 종목 상세 분석 페이지

---

#### [NEW] [src/app/(dashboard)/stocks/[id]/page.tsx](file:///d:/Project/Github/StockPilot/src/app/(dashboard)/stocks/[id]/page.tsx)

종목 상세 분석 페이지 (탭 구조):

```
[요약] [매도 타이밍] [추가 매수] [익절/손절] [매매 전략] [보유 기간] [애널리스트]
```

---

#### [NEW] [src/components/analysis/SummaryTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/SummaryTab.tsx)

**요약 탭** 구현:
- 현재 성과 평가 문장
- 목표가 대비 현재 위치 프로그레스 바
- 종목 특성 요약 (사업구조, 산업포지션, 배당성향)
- 밸류에이션 상태 (PER, PBR, ROE)
- 포트폴리오 내 비중 파이 차트

---

#### [NEW] [src/components/analysis/ExitTimingTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/ExitTimingTab.tsx)

**매도 타이밍 탭** 구현:
- 1차 익절 전략 카드
  - 목표가, 매도 수량, 예상 수익
  - 기술적/펀더멘털 근거
  - 권장 시점
- 2차 익절 전략 카드
  - 최종 목표가, 잔여 물량 전략
  - 리스크 요인, 예상 보유 기간
- 단계적 익절 추천 문구

---

#### [NEW] [src/components/analysis/AccumulationTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/AccumulationTab.tsx)

**추가 매수 탭** 구현:
- 추가 매수 가능 구간 차트 (지지선 표시)
- 권장 추가 매수 비중 (%)
- 매수 시점 조건 리스트

---

#### [NEW] [src/components/analysis/RiskControlTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/RiskControlTab.tsx)

**익절/손절 탭** 구현:
- 손절선 표시 (가격 기준, 포트폴리오 손실 한도 기준)
- 주요 리스크 요인 카드
- 방어 전략 제시 (부분 매도, 비중 축소, 헤지)

---

#### [NEW] [src/components/analysis/TradingStrategyTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/TradingStrategyTab.tsx)

**매매 전략 탭** 구현:
- 현재 시장 국면 판단 배지 (추세추종/박스권/변동성확대)
- 권장 전략 유형 (단기 스윙/중기 보유/장기 투자)
- 포트폴리오 내 역할 정의

---

#### [NEW] [src/components/analysis/HoldingPeriodTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/HoldingPeriodTab.tsx)

**보유 기간 탭** 구현:
- 권장 보유 기간 타임라인
- 근거 설명 (산업 사이클, 실적 사이클, 거시 환경)

---

#### [NEW] [src/components/analysis/AnalystTab.tsx](file:///d:/Project/Github/StockPilot/src/components/analysis/AnalystTab.tsx)

**애널리스트 탭** 구현:
- 증권사 리포트 요약 테이블
- 투자 의견 분포 차트
- 목표주가 범위 및 평균
- 연간/분기별 전망 타임라인

---

### Phase 8: 분석 엔진 서비스

---

#### [NEW] [src/services/analysis/summary-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/summary-engine.ts)

```typescript
class SummaryEngine {
  generatePerformanceText(holding: Holding, currentPrice: number): string;
  calculateTargetProgress(holding: Holding, targetPrice: number): number;
  summarizeStockCharacteristics(stockCode: string): StockCharacteristics;
  evaluateValuation(stockCode: string): ValuationStatus;
  calculatePortfolioWeight(holding: Holding, portfolio: Portfolio): number;
}
```

---

#### [NEW] [src/services/analysis/exit-timing-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/exit-timing-engine.ts)

```typescript
class ExitTimingEngine {
  generateFirstExitStrategy(holding: Holding, marketData: MarketData): ExitStrategy;
  generateSecondExitStrategy(holding: Holding, marketData: MarketData): ExitStrategy;
  generateExitRecommendation(strategies: ExitStrategy[]): string;
}
```

---

#### [NEW] [src/services/analysis/accumulation-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/accumulation-engine.ts)

```typescript
class AccumulationEngine {
  calculateSupportLevels(priceData: PriceData[]): number[];
  calculateAccumulationZone(stockCode: string): AccumulationZone;
  suggestAccumulationRatio(holding: Holding, portfolio: Portfolio): number;
  evaluateBuyConditions(stockCode: string): BuyCondition[];
}
```

---

#### [NEW] [src/services/analysis/risk-control-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/risk-control-engine.ts)

```typescript
class RiskControlEngine {
  calculateStopLoss(holding: Holding, method: 'price' | 'portfolio'): number;
  identifyRiskFactors(stockCode: string): RiskFactor[];
  suggestDefenseStrategies(riskLevel: RiskLevel): DefenseStrategy[];
}
```

---

#### [NEW] [src/services/analysis/trading-strategy-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/trading-strategy-engine.ts)
#### [NEW] [src/services/analysis/holding-horizon-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/holding-horizon-engine.ts)
#### [NEW] [src/services/analysis/analyst-insight-engine.ts](file:///d:/Project/Github/StockPilot/src/services/analysis/analyst-insight-engine.ts)

추가 분석 엔진 구현

---

### Phase 9: 시장 데이터 서비스

---

#### [NEW] [src/services/market-data/price-service.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/price-service.ts)

```typescript
class PriceService {
  getCurrentPrice(stockCode: string): Promise<PriceData>;
  getHistoricalPrices(stockCode: string, period: Period): Promise<PriceData[]>;
  subscribeToPrice(stockCode: string, callback: (price: number) => void): Unsubscribe;
}
```

---

#### [NEW] [src/services/market-data/financial-service.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/financial-service.ts)

```typescript
class FinancialService {
  getFinancials(stockCode: string): Promise<Financials>;
  getValuationMetrics(stockCode: string): Promise<ValuationMetrics>;
}
```

---

#### [NEW] [src/services/market-data/analyst-service.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/analyst-service.ts)

```typescript
class AnalystService {
  getReports(stockCode: string): Promise<AnalystReport[]>;
  getConsensus(stockCode: string): Promise<ConsensusData>;
}
```

---

#### [NEW] [src/services/market-data/toss-crawler.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/toss-crawler.ts)

토스증권 데이터 크롤링 서비스:

```typescript
class TossCrawler {
  // URL 패턴: https://www.tossinvest.com/stocks/[종목코드]/order
  getStockInfo(stockCode: string): Promise<TossStockInfo>;
  getChartData(stockCode: string): Promise<TossChartData>;
  getOrderBook(stockCode: string): Promise<TossOrderBook>;
}
```

---

#### [NEW] [src/services/market-data/naver-crawler.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/naver-crawler.ts)

네이버 금융 크롤링 서비스 (애널리스트 리포트):

```typescript
class NaverCrawler {
  getAnalystReports(stockCode: string): Promise<NaverAnalystReport[]>;
  getTargetPrices(stockCode: string): Promise<NaverTargetPrice[]>;
  getNews(stockCode: string): Promise<NaverNews[]>;
}
```

---

#### [NEW] [src/services/market-data/seibro-crawler.ts](file:///d:/Project/Github/StockPilot/src/services/market-data/seibro-crawler.ts)

세이브로 크롤링 서비스 (금융투자협회 공개 리포트):

```typescript
class SeibroCrawler {
  getPublicReports(stockCode: string): Promise<SebroReport[]>;
  getInvestmentRecommendations(stockCode: string): Promise<SebroRecommendation[]>;
}
```

---

### Phase 10: 리포트 생성 시스템

---

#### [NEW] [src/services/reports/report-generator.ts](file:///d:/Project/Github/StockPilot/src/services/reports/report-generator.ts)

```typescript
class ReportGenerator {
  generatePortfolioReport(portfolioId: string): Promise<PortfolioReport>;
  generateStockReport(holdingId: string): Promise<StockReport>;
}
```

---

#### [NEW] [src/services/reports/pdf-exporter.ts](file:///d:/Project/Github/StockPilot/src/services/reports/pdf-exporter.ts)

PDF 리포트 생성 (react-pdf 또는 puppeteer 기반)

---

#### [NEW] [src/app/(dashboard)/reports/page.tsx](file:///d:/Project/Github/StockPilot/src/app/(dashboard)/reports/page.tsx)

리포트 목록 및 다운로드 페이지

---

### Phase 11: 알림 시스템

---

#### [NEW] [src/services/alerts/alert-service.ts](file:///d:/Project/Github/StockPilot/src/services/alerts/alert-service.ts)

```typescript
class AlertService {
  createPriceAlert(holdingId: string, targetPrice: number, type: 'above' | 'below'): Promise<Alert>;
  checkAlerts(): Promise<TriggeredAlert[]>;
  sendNotification(alert: TriggeredAlert): Promise<void>;
}
```

---

#### [NEW] [src/components/alerts/AlertBanner.tsx](file:///d:/Project/Github/StockPilot/src/components/alerts/AlertBanner.tsx)

실시간 알림 배너 컴포넌트

---

### Phase 12: 리밸런싱 모듈

---

#### [NEW] [src/services/portfolio/rebalancing-engine.ts](file:///d:/Project/Github/StockPilot/src/services/portfolio/rebalancing-engine.ts)

```typescript
class RebalancingEngine {
  analyzeWeightImbalance(portfolio: Portfolio): WeightAnalysis;
  analyzeSectorConcentration(portfolio: Portfolio): SectorAnalysis;
  detectHighRiskAssets(portfolio: Portfolio): RiskAsset[];
  generateRebalancingScenarios(portfolio: Portfolio): RebalancingScenario[];
}
```

---

## Verification Plan

### Automated Tests

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 타입 체크
npm run type-check

# 린트 체크
npm run lint
```

### Browser Testing
- 주요 브라우저 테스트 (Chrome, Firefox, Safari, Edge)
- 반응형 디자인 테스트 (Desktop, Tablet, Mobile)
- 다크모드 테스트

### Manual Verification
1. 사용자 시나리오 테스트
   - 회원가입 → 포트폴리오 생성 → 종목 추가 → 분석 확인
2. Firebase Hosting 배포 후 프로덕션 환경 테스트
3. Storybook 컴포넌트 시각적 테스트

---

## 개발 일정 (12주)

| 주차 | Phase | 주요 작업 |
|------|-------|----------|
| 1 | Phase 1 | 프로젝트 초기화, 기본 설정, CI/CD |
| 2 | Phase 2-3 | Firebase 인프라, 타입 정의 |
| 3 | Phase 4-5 | UI 컴포넌트, 레이아웃 |
| 4 | Phase 6 | 포트폴리오 대시보드 |
| 5 | Phase 7 (1/2) | 종목 상세 - 요약, 매도타이밍, 추가매수 탭 |
| 6 | Phase 7 (2/2) | 종목 상세 - 익절손절, 매매전략, 보유기간, 애널리스트 탭 |
| 7 | Phase 8 (1/2) | 분석 엔진 - Summary, ExitTiming, Accumulation |
| 8 | Phase 8 (2/2) | 분석 엔진 - RiskControl, TradingStrategy, HoldingHorizon, Analyst |
| 9 | Phase 9 | 시장 데이터 서비스 API 연동 |
| 10 | Phase 10 | 리포트 생성 시스템 |
| 11 | Phase 11-12 | 알림 시스템, 리밸런싱 모듈 |
| 12 | QA | 테스트, 버그 수정, 최적화 |

---

## 시작 명령어

```bash
# 1. 프로젝트 생성
npx create-next-app@latest stockpilot --typescript --tailwind --eslint --app --src-dir --turbopack

# 2. 디렉토리 이동
cd stockpilot

# 3. 추가 의존성 설치
npm install firebase zustand @tanstack/react-query
npm install recharts date-fns lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install clsx tailwind-merge

# 4. shadcn/ui 초기화
npx shadcn@latest init

# 5. Firebase 초기화
firebase init hosting firestore

# 6. Storybook 초기화
npx storybook@latest init

# 7. 개발 서버 시작
npm run dev
```
