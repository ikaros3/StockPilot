# 🚀 StockPilot 개발 계획 프롬프트

> **프로젝트명**: StockPilot - 개인 투자자용 포트폴리오 분석 및 리포팅 플랫폼
> 
> **목표**: 개인 투자자가 전문 리서치 리포트 수준의 분석 결과를 손쉽게 확인하고 의사결정을 지원받을 수 있는 웹 애플리케이션 개발

---

## 📋 프로젝트 개요

### 제품 비전
사용자가 보유 종목을 입력하면 현재 상태 평가 → 매도/추가매수/보유 전략 → 애널리스트 의견 → 종합 투자 결론까지 자동 생성하는 **리서치 기반 포트폴리오 분석 시스템** 구축

### 핵심 가치
- 복잡한 금융 분석을 자동화하여 직관적인 대시보드와 리포트 형태로 제공
- 실시간 시장 데이터 + 애널리스트 의견 + AI 분석을 통합한 통합 투자 판단 플랫폼
- 단순 조회 앱이 아닌 전략 제안 중심 리서치 도구

### 대상 사용자
- 개인 투자자 (초급~중급)
- 직접 투자 전략을 수립하되, 리서치 기반 의사결정 보조가 필요한 사용자
- 주식, ETF, 레버리지 상품을 포함한 포트폴리오 운용 사용자

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts 또는 TradingView Lightweight Charts
- **UI Components**: shadcn/ui + Storybook
- **Form Handling**: React Hook Form + Zod

### Backend / BaaS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Functions**: Firebase Cloud Functions (필요 시)

### 외부 API
- **주식 데이터**: 한국투자증권 Open API / KRX 공공데이터
- **애널리스트 리포트**: FnGuide, 세이브로 등 (라이선스 확인 필요)
- **뉴스/공시**: DART API, 네이버 금융 크롤링

### DevOps
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions → Firebase Hosting 자동 배포
- **Documentation**: Storybook

---

## 📁 프로젝트 폴더 구조

```
StockPilot/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml     # Firebase 자동 배포
├── .agent/
│   ├── workflows/                   # Agent 워크플로우
│   └── skills/                      # Agent Skills
│       ├── data-fetching/           # 시장 데이터 수집 스킬
│       ├── analysis-engine/         # 분석 엔진 스킬
│       └── report-generator/        # 리포트 생성 스킬
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # 인증 관련 라우트
│   │   ├── (dashboard)/             # 대시보드 라우트
│   │   │   ├── page.tsx             # 포트폴리오 요약
│   │   │   ├── stocks/              # 종목 관련 페이지
│   │   │   │   ├── [id]/            # 종목 상세 분석
│   │   │   │   └── add/             # 종목 추가
│   │   │   ├── reports/             # 리포트 페이지
│   │   │   └── settings/            # 설정 페이지
│   │   ├── api/                     # API Routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 컴포넌트
│   │   ├── charts/                  # 차트 컴포넌트
│   │   ├── cards/                   # 카드 컴포넌트
│   │   ├── forms/                   # 폼 컴포넌트
│   │   └── layout/                  # 레이아웃 컴포넌트
│   ├── hooks/                       # 커스텀 훅
│   ├── lib/
│   │   ├── firebase/                # Firebase 설정
│   │   ├── api/                     # API 클라이언트
│   │   └── utils/                   # 유틸리티 함수
│   ├── stores/                      # Zustand 스토어
│   ├── types/                       # TypeScript 타입
│   ├── constants/                   # 상수 정의
│   └── services/
│       ├── analysis/                # 분석 엔진 서비스
│       │   ├── summary-engine.ts
│       │   ├── exit-timing-engine.ts
│       │   ├── accumulation-engine.ts
│       │   ├── risk-control-engine.ts
│       │   ├── trading-strategy-engine.ts
│       │   ├── holding-horizon-engine.ts
│       │   └── analyst-insight-engine.ts
│       ├── portfolio/               # 포트폴리오 서비스
│       ├── market-data/             # 시장 데이터 서비스
│       └── reports/                 # 리포트 생성 서비스
├── public/
├── stories/                         # Storybook 스토리
├── tests/                           # 테스트 파일
├── firebase.json
├── firestore.rules
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🔄 개발 워크플로우

### Phase 1: 프로젝트 초기화 (Week 1)
1. Next.js 15 프로젝트 생성 및 기본 설정
2. TypeScript, Tailwind CSS, ESLint, Prettier 설정
3. Firebase 프로젝트 연동 (Auth, Firestore, Hosting)
4. GitHub Actions CI/CD 파이프라인 구축
5. Storybook 설정

### Phase 2: 기반 인프라 구축 (Week 2)
1. Firebase Auth 인증 시스템 구현
2. Firestore 데이터 스키마 설계 및 구현
3. 기본 레이아웃 및 네비게이션 구현
4. 공통 UI 컴포넌트 개발 (shadcn/ui 기반)

### Phase 3: 사용자 데이터 입력 모듈 (Week 3)
1. 종목 추가/수정/삭제 CRUD 기능
2. 포트폴리오 데이터 입력 폼
3. 투자 성향 설정 기능
4. 매수 이력 관리 기능

### Phase 4: 시장 데이터 연동 (Week 4)
1. 주식 시세 API 연동
2. 재무제표 데이터 수집
3. 밸류에이션 지표 계산
4. 데이터 캐싱 및 갱신 로직

### Phase 5: 포트폴리오 대시보드 (Week 5)
1. 포트폴리오 요약 카드 구현
2. 종목별 카드 리스트 구현
3. 성과 지표 계산 로직
4. 시각화 차트 구현

### Phase 6: 분석 엔진 개발 (Week 6-8)
1. **요약 엔진 (Summary Engine)**
   - 현재 성과 평가 문장 생성
   - 목표가 대비 위치 평가
   - 종목 특성 요약

2. **매도 타이밍 엔진 (Exit Timing Engine)**
   - 1차/2차 익절 전략 생성
   - 단계적 익절 추천

3. **추가 매수 엔진 (Accumulation Engine)**
   - 매수 가능 구간 산출
   - 매수 시점 조건 분석

4. **리스크 컨트롤 엔진 (Risk Control Engine)**
   - 손절선 자동 계산
   - 방어 전략 제시

5. **매매 전략 엔진 (Trading Strategy Engine)**
   - 시장 국면 판단
   - 권장 전략 제시

6. **보유 기간 엔진 (Holding Horizon Engine)**
   - 권장 보유 기간 산출
   - 근거 분석

7. **애널리스트 인사이트 엔진 (Analyst Insight Engine)**
   - 리포트 요약
   - 목표주가 컨센서스 분석

### Phase 7: 종합 평가 및 리밸런싱 (Week 9)
1. 종합 투자 등급 산출 로직
2. 종합 평가 문장 자동 생성
3. 포트폴리오 리밸런싱 분석
4. 리밸런싱 시나리오 제안

### Phase 8: 리포트 시스템 (Week 10)
1. 웹 대시보드 리포트 뷰
2. PDF 리포트 생성 기능
3. 주간/월간 리포트 자동화

### Phase 9: 알림 시스템 (Week 11)
1. 목표가/손절가 알림
2. 뉴스/공시 알림
3. 리스크 경고 알림
4. Push 알림 연동

### Phase 10: 테스트 및 최적화 (Week 12)
1. E2E 테스트 작성
2. 성능 최적화
3. 보안 점검
4. 사용자 피드백 반영

---

## 🤖 에이전트 (Sub-Agent) 설계

### 1. Data Fetcher Agent
- **역할**: 외부 API로부터 시장 데이터 수집
- **기능**:
  - 주가 데이터 실시간 수집
  - 재무제표 정기 수집
  - 뉴스/공시 모니터링

### 2. Analysis Agent
- **역할**: 수집된 데이터 기반 분석 수행
- **기능**:
  - 기술적 분석 (지지/저항선, 추세 분석)
  - 펀더멘털 분석 (밸류에이션, 재무 건전성)
  - 비교 분석 (동종업계, 시장 대비)

### 3. Strategy Agent
- **역할**: 투자 전략 수립 및 추천
- **기능**:
  - 매도/매수 타이밍 결정
  - 포지션 크기 추천
  - 리밸런싱 시나리오 생성

### 4. Report Agent
- **역할**: 분석 결과를 사용자 친화적 리포트로 변환
- **기능**:
  - 자연어 분석 리포트 생성
  - 시각화 자료 생성
  - PDF 리포트 포맷팅

### 5. Alert Agent
- **역할**: 실시간 모니터링 및 알림
- **기능**:
  - 가격 조건 모니터링
  - 이벤트 감지 (실적, 뉴스)
  - 알림 발송

---

## 🎯 Skills 설계

### 1. Market Data Skill
```
skills/
└── market-data/
    ├── SKILL.md
    ├── scripts/
    │   ├── fetch-price.ts
    │   ├── fetch-financials.ts
    │   └── fetch-news.ts
    └── examples/
```

### 2. Technical Analysis Skill
```
skills/
└── technical-analysis/
    ├── SKILL.md
    ├── scripts/
    │   ├── support-resistance.ts
    │   ├── trend-analysis.ts
    │   └── indicator-calc.ts
    └── examples/
```

### 3. Valuation Skill
```
skills/
└── valuation/
    ├── SKILL.md
    ├── scripts/
    │   ├── per-pbr-calc.ts
    │   ├── dcf-model.ts
    │   └── peer-comparison.ts
    └── examples/
```

### 4. Report Generation Skill
```
skills/
└── report-generation/
    ├── SKILL.md
    ├── scripts/
    │   ├── summary-generator.ts
    │   ├── chart-generator.ts
    │   └── pdf-exporter.ts
    └── templates/
```

---

## 📊 Firestore 데이터 스키마

### users
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  investmentStyle: 'aggressive' | 'moderate' | 'conservative';
  investmentHorizon: 'short' | 'medium' | 'long';
  targetReturn: number;
  maxLoss: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### portfolios
```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### holdings
```typescript
interface Holding {
  id: string;
  portfolioId: string;
  stockCode: string;
  stockName: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: Timestamp;
  additionalPurchases: AdditionalPurchase[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AdditionalPurchase {
  price: number;
  quantity: number;
  date: Timestamp;
}
```

### analysisReports
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
```

---

## 🎨 UI/UX 컴포넌트 (Storybook)

### Core Components
- `Button` - 다양한 variants (primary, secondary, outline, ghost)
- `Card` - 종목 카드, 요약 카드
- `Badge` - 성과 상태 배지 (강세, 중립, 약세)
- `Input` / `Select` - 폼 입력
- `Modal` - 알림, 확인 다이얼로그
- `Tabs` - 분석 탭 네비게이션

### Chart Components
- `PriceChart` - 주가 차트
- `PerformanceChart` - 수익률 차트
- `AllocationChart` - 포트폴리오 비중 파이 차트
- `ComparisonChart` - 비교 차트

### Layout Components
- `Header` - 상단 네비게이션
- `Sidebar` - 사이드 메뉴
- `Footer` - 하단 푸터
- `PageContainer` - 페이지 래퍼

### Feature Components
- `StockCard` - 종목 카드
- `PortfolioSummary` - 포트폴리오 요약
- `AnalysisTabs` - 분석 탭 컨테이너
- `ReportViewer` - 리포트 뷰어
- `AlertBanner` - 알림 배너

---

## ✅ 성공 지표 (KPIs)

- **DAU/MAU 비율**: 월간 활성 사용자 대비 일간 활성 비율
- **리포트 조회 수**: 일 평균 리포트 조회 횟수
- **재방문률**: 7일/30일 재방문율
- **추천 전략 실행 비율**: 추천 전략 조회 후 실제 매매 실행 비율
- **사용자 만족도**: NPS 점수
- **알림 반응률**: 알림 발송 후 앱 접속률

---

## ⚠️ 제약사항 및 리스크

1. **데이터 API 비용**: 실시간 주가 데이터 API 비용 관리 필요
2. **저작권 이슈**: 애널리스트 리포트 요약 시 저작권 확인 필요
3. **투자 자문 규제**: 투자 조언으로 간주될 수 있어 법적 검토 필요
4. **시장 변동성**: 급변하는 시장에서 전략 신뢰성 관리

---

## 🚀 향후 확장 계획

- 증권사 계좌 연동 (Open Banking)
- 자동 매매 봇 기능
- 머신러닝 기반 수익률 예측
- 자산군 확장 (ETF, 채권, 코인, 해외주식)
- 소셜 기능 (포트폴리오 공유, 전략 공유)
- 모바일 앱 (React Native / Flutter)

---

## 📝 개발 시작 명령어

```bash
# 프로젝트 생성
npx create-next-app@latest stockpilot --typescript --tailwind --eslint --app --src-dir

# 의존성 설치
cd stockpilot
npm install firebase zustand @tanstack/react-query recharts
npm install @hookform/resolvers zod react-hook-form
npm install -D storybook @storybook/react

# shadcn/ui 초기화
npx shadcn@latest init

# Storybook 초기화
npx storybook@latest init

# Firebase 초기화
firebase init
```

---

> 이 문서는 StockPilot 프로젝트의 전체 개발 계획을 담고 있습니다.
> 각 Phase별로 상세 구현 계획을 수립하여 진행합니다.
