# StockPilot AI - 종목 상세 분석 엔진 통합 개발 워크플로우

> **최종 목표**: 최적의 투자 타이밍(매수/매도 금액 및 시점) 도출 제시

**환경**: Firebase 기반 배포/운영  
**개발 방식**: 단계별 순차 개발 + AI 엔진 모듈 분리  
**최종 업데이트**: 2026-01-27

---

## 📋 목차

1. [전체 시스템 아키텍처](#전체-시스템-아키텍처)
2. [개발 우선순위 및 단계](#개발-우선순위-및-단계)
3. [Firebase 인프라 구성](#firebase-인프라-구성)
4. [각 엔진별 상세 워크플로우](#각-엔진별-상세-워크플로우)
5. [AI 엔진 모듈 연계 계획](#ai-엔진-모듈-연계-계획)
6. [개발 로드맵 및 일정](#개발-로드맵-및-일정)
7. [기술 스택 및 구현 가이드](#기술-스택-및-구현-가이드)

---

## 📐 전체 시스템 아키텍처

### 계층별 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    🎯 최종 목표 (Goal Layer)                 │
│             최적 투자 타이밍 및 매수/매도 의사결정               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│              📊 통합 리포트 계층 (Report Layer)               │
│                    [1] 요약 (Summary)                        │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│            🎮 리스크 관리 계층 (Risk Control Layer)           │
│              [6] 익절/손절 (Take Profit/Stop Loss)           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│            📈 실행 계층 (Execution Layer)                    │
│  [4] 매도 타이밍  │  [5] 추가 매수  │  [7] 보유 기간            │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│            🧠 전략 수립 계층 (Strategy Layer)                │
│                   [3] 매매 전략 (Trading Strategy)           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│              📚 분석 기반 계층 (Analysis Foundation)          │
│                   [2] 애널리스트 (Analyst)                    │
│         재무분석 │  기술적분석 │ 수급분석 │ 센티먼트             │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│            🗄️ 데이터 수집 계층 (Data Infrastructure)          │
│          시장 데이터 │ 재무 데이터 │ 뉴스 데이터                │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 (Data Flow)

```
[Data Collection] 
    ↓
[Data Processing & Storage - Firebase]
    ↓
[Analysis Engines]
    ├─ 재무/펀더멘털 분석 ──┐
    ├─ 기술적 분석 ─────────┤
    ├─ 수급 분석 ───────────┼─→ [애널리스트 통합]
    ├─ 센티먼트 분석 ───────┤
    └─ 섹터/테마 분석 ──────┘
              ↓
        [매매 전략 수립]
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
[매도 타이밍] [추가 매수] [보유 기간]
    └─────────┼─────────┘
              ↓
        [익절/손절 관리]
              ↓
        [종합 요약 리포트]
              ↓
        [사용자 의사결정]
```

---

## 🎯 개발 우선순위 및 단계

### Phase 1: 기초 인프라 (2-3주)

**목표**: 데이터 수집 및 저장 파이프라인 구축

#### 우선순위 0: 데이터 인프라 (선행 필수)

```
┌──────────────────────────────────────────────────┐
│         📦 데이터 수집 모듈 (Data Layer)           │
├──────────────────────────────────────────────────┤
│ ✓ KIS Open API 연동                              │
│ ✓ 네이버 금융 크롤링                              │
│ ✓ DART 공시 수집                                 │
│ ✓ 뉴스 데이터 수집                                │
│ ✓ Firebase Firestore 스키마 설계                 │
│ ✓ Cloud Functions 스케줄러 설정                   │
└──────────────────────────────────────────────────┘
```

**주요 작업**:

- API 연동 및 인증 설정
  - KIS Open API 실패 시 -> 대안으로 사용 가능한 다른 Open API 사용
- 데이터 수집 스케줄러 구축 (Cloud Functions + Cloud Scheduler)
- Firestore 데이터 모델 설계
- 실시간 시세 WebSocket 연결
- 에러 핸들링 및 재시도 로직

**산출물**:

- 데이터 수집 Cloud Functions
- Firestore 컬렉션 구조
- API 래퍼 라이브러리

---

### Phase 2: 핵심 분석 엔진 (3-4주)

#### 우선순위 1: 애널리스트 분석 엔진

**개발 이유**: 

- 전문가 의견은 모든 분석의 기준점 역할
- 가장 신뢰도 높은 외부 데이터
- 다른 엔진의 검증 기준으로 활용

**포함 항목**:

- ✅ 증권사 리포트 수집 (크롤링)
- ✅ 목표주가 컨센서스 계산
- ✅ 투자의견 종합 (매수/보유/매도)
- ✅ 리포트 요약 (🤖 AI 엔진 연계)
- ✅ 애널리스트 정확도 추적
- ✅ 의견 변화 알림

**Firebase 구성**:

```javascript
// Firestore 데이터 구조
/analyst_reports/{stockCode}/{reportId}
  - securities_firm: string
  - analyst_name: string
  - target_price: number
  - investment_opinion: string (BUY/HOLD/SELL)
  - report_date: timestamp
  - summary: string (AI 생성)
  - accuracy_score: number

/analyst_consensus/{stockCode}
  - avg_target_price: number
  - consensus_opinion: string
  - report_count: number
  - last_updated: timestamp
```

**워크플로우**:

```
[일일 스케줄러 - Cloud Scheduler]
       ↓
[리포트 크롤링 - Cloud Functions]
  ├─ 증권사 사이트 크롤링
  ├─ DART API 호출
  └─ 한경컨센서스 API
       ↓
[데이터 전처리]
  ├─ 텍스트 추출
  ├─ 목표가 정규화
  └─ 표준화
       ↓
[🤖 AI 리포트 요약 (별도 Python 서버)]
  ├─ Claude API 호출
  ├─ 핵심 내용 추출
  └─ 긍정/부정 분류
       ↓
[Firestore 저장]
  ├─ 개별 리포트 저장
  └─ 컨센서스 업데이트
       ↓
[실시간 업데이트 - Firebase Realtime]
       ↓
[클라이언트 표시]
```

**🤖 AI 엔진 모듈 (별도 개발)**:

- **언어**: Python 3.11+
- **프레임워크**: FastAPI
- **배포**: Cloud Run (컨테이너)
- **기능**:
  - 리포트 텍스트 요약 (Claude API)
  - 핵심 투자 논리 추출
  - 감성 분석 (긍정/중립/부정)
- **호출 방식**: Cloud Functions → Cloud Run (HTTP)

---

### Phase 3: 전략 수립 엔진 (3-4주)

#### 우선순위 2: 매매 전략 엔진

**개발 이유**:

- 모든 실행 엔진(매도/추가매수/보유기간)의 기준 제공
- 투자 성향별 맞춤 전략 필요
- 백테스트 기반 검증된 전략 제시

**포함 항목**:

- ✅ 투자 성향별 전략 (공격/중립/보수)
- ✅ 시장 상황 분석 (상승/하락/박스권)
- ✅ 섹터 로테이션 전략
- ✅ 백테스트 결과 (🤖 AI 엔진 연계)
- ✅ 리스크/수익 시뮬레이션
- ✅ 매수/매도 신호 종합

**Firebase 구성**:

```javascript
/trading_strategies/{stockCode}
  - user_profile: object
    - risk_tolerance: string (aggressive/moderate/conservative)
    - investment_period: string (short/mid/long)
  - market_analysis: object
    - current_phase: string (bull/bear/sideways)
    - volatility_level: number
  - recommended_strategy: object
    - entry_signals: array
    - exit_signals: array
    - position_size: number
  - backtest_results: object
    - win_rate: number
    - avg_return: number
    - max_drawdown: number
    - sharpe_ratio: number
```

**워크플로우**:

```
[사용자 프로필 입력]
       ↓
[시장 데이터 수집]
  ├─ KOSPI/KOSDAQ 지수
  ├─ 섹터별 수익률
  ├─ 외국인/기관 수급
  └─ 변동성 지표
       ↓
[기술적 지표 계산]
  ├─ RSI, MACD, 볼린저밴드
  ├─ 이동평균선
  └─ 거래량 패턴
       ↓
[🤖 전략 생성 AI (별도 Python 서버)]
  ├─ 사용자 프로필 매칭
  ├─ 시장 상황 분석
  ├─ 최적 전략 선택
  └─ 백테스트 실행
       ↓
[전략 결과 저장 - Firestore]
       ↓
[실시간 신호 모니터링 - Cloud Functions]
  ├─ 매수 신호 감지
  ├─ 매도 신호 감지
  └─ 알림 전송 (FCM)
```

**🤖 AI 엔진 모듈 (별도 개발)**:

- **기능**:
  - 백테스트 엔진 (Backtrader, Zipline)
  - 전략 최적화 (QuantLib, PyPortfolioOpt)
  - 시나리오 시뮬레이션 (Monte Carlo)
- **입력**: 사용자 프로필 + 시장 데이터
- **출력**: 최적 매매 전략 + 예상 수익률

---

### Phase 4: 실행 엔진 그룹 (4-5주)

이 단계에서는 3개 엔진을 병렬 개발합니다.

#### 우선순위 3-1: 매도 타이밍 엔진

**개발 이유**: 수익 실현 및 손실 방지의 핵심 기능

**포함 항목**:

- ✅ 목표가 대비 현재가 비율
- ✅ 기술적 매도 신호 (RSI 과매수, 데드크로스)
- ✅ 수급 악화 징후 (외국인/기관 순매도)
- ✅ 밸류에이션 고평가 여부
- ✅ 분할 매도 전략 (3단계)
- ✅ 실시간 알림

**워크플로우**:

```
[실시간 가격 모니터링 - Firestore Listener]
       ↓
[매도 신호 체크]
  ├─ 목표가 도달 (컨센서스 대비)
  ├─ RSI > 70 (과매수)
  ├─ MACD 데드크로스
  ├─ 외국인 3일 연속 순매도
  └─ PER/PBR 고평가
       ↓
[긴급도 판정]
  ├─ 상(즉시): 3개 이상 신호
  ├─ 중(검토): 2개 신호
  └─ 하(관망): 1개 이하
       ↓
[분할 매도 전략 계산]
  ├─ 1차 매도: 30% (목표가 70% 도달)
  ├─ 2차 매도: 30% (목표가 100% 도달)
  └─ 3차 매도: 40% (목표가 130% 도달)
       ↓
[알림 전송 - FCM]
  └─ "삼성전자 1차 매도 타이밍 도달!"
```

#### 우선순위 3-2: 추가 매수 엔진

**개발 이유**: 평단가 조정 및 분할 매수 전략

**포함 항목**:

- ✅ 기술적 매수 시점 (RSI 과매도, 볼린저 하단)
- ✅ 수급 개선 신호 (외국인/기관 매수)
- ✅ 밸류에이션 저평가 여부
- ✅ 분할 매수 계획 (3-5회)
- ✅ 적정 매수 금액 계산
- ✅ 포트폴리오 비중 고려

**워크플로우**:

```
[현재 포지션 확인 - Firestore]
  ├─ 보유 수량
  ├─ 평균 매수가
  └─ 평가손익
       ↓
[매수 신호 체크]
  ├─ RSI < 30 (과매도)
  ├─ 볼린저밴드 하단 접근
  ├─ 외국인 매수 전환
  └─ PER 업종 평균 이하
       ↓
[추가매수 점수 계산]
  ├─ 기술적 점수 (30%)
  ├─ 수급 점수 (25%)
  ├─ 밸류에이션 점수 (25%)
  └─ 애널리스트 점수 (20%)
       ↓
[분할매수 전략]
  ├─ 1차: 현재가 -5%
  ├─ 2차: 현재가 -10%
  └─ 3차: 현재가 -15%
       ↓
[알림 설정 - Cloud Functions]
  └─ 목표 매수가 도달 시 FCM 알림
```

#### 우선순위 3-3: 보유 기간 엔진

**개발 이유**: 투자 목적별 최적 기간 제시

**포함 항목**:

- ✅ 투자 목적별 권장 기간
- ✅ 업종 특성 고려
- ✅ 실적 발표 일정
- ✅ 배당 스케줄
- ✅ 기간별 기대수익률
- ✅ 체크포인트 알림

**워크플로우**:

```
[투자 목적 확인]
  ├─ 단기 트레이딩
  ├─ 스윙 트레이딩
  └─ 중장기 투자
       ↓
[업종별 특성 매핑]
  ├─ IT/바이오: 단기-중기
  ├─ 반도체: 중기 (사이클)
  ├─ 금융: 장기
  └─ 소비재: 중장기
       ↓
[이벤트 스케줄 확인]
  ├─ 실적 발표일
  ├─ 배당 기준일
  └─ 주주총회
       ↓
[최적 보유 기간 계산]
  ├─ 추천 기간
  ├─ 최소 기간
  └─ 재검토 시점
       ↓
[알림 스케줄링]
  ├─ 1개월 후 재평가
  ├─ 실적 발표 전 점검
  └─ 목표 기간 도달
```

---

### Phase 5: 리스크 관리 (2주)

#### 우선순위 4: 익절/손절 엔진

**개발 이유**: 자동 리스크 관리 및 수익 실현

**포함 항목**:

- ✅ 투자 성향별 기준 설정
- ✅ 익절 라인 (3단계)
- ✅ 손절 라인 (트레일링 스탑)
- ✅ 실시간 모니터링
- ✅ 자동 알림

**Firebase 구성**:

```javascript
/profit_loss_rules/{userId}/{stockCode}
  - user_settings: object
    - risk_profile: string
    - target_profit: number (%)
    - stop_loss: number (%)
    - trailing_stop: boolean
  - current_status: object
    - entry_price: number
    - current_price: number
    - profit_rate: number
    - highest_price: number (트레일링용)
  - alert_levels: array
    - {type: 'profit', level: 1, price: number, triggered: boolean}
    - {type: 'profit', level: 2, price: number, triggered: boolean}
    - {type: 'stop_loss', price: number, triggered: boolean}
```

**워크플로우**:

```
[사용자 설정 입력]
  ├─ 투자 성향 (공격/중립/보수)
  ├─ 목표 수익률
  └─ 허용 손실률
       ↓
[익절/손절가 계산]
  ├─ 1차 익절: +7% (목표의 70%)
  ├─ 2차 익절: +10% (목표의 100%)
  ├─ 3차 익절: +13% (목표의 130%)
  └─ 손절: -10%
       ↓
[실시간 가격 모니터링 - Cloud Functions]
  └─ Firestore onUpdate 트리거
       ↓
[조건 체크]
  ├─ 익절가 도달?
  ├─ 손절가 도달?
  └─ 트레일링 스탑 발동?
       ↓
[알림 전송 - FCM]
  ├─ "1차 익절가 도달! (+7%)"
  ├─ "손절가 근접! 주의 필요"
  └─ "트레일링 스탑 발동"
       ↓
[포지션 자동 청산 옵션]
  └─ 사용자 설정에 따라 자동 매도 주문
```

---

### Phase 6: 통합 리포트 (2주)

#### 우선순위 5: 요약 (종합 리포트) 엔진

**개발 이유**: 모든 분석 결과를 한눈에 제시

**포함 항목**:

- ✅ 종목 기본 정보
- ✅ 핵심 투자 포인트 (AI 추출)
- ✅ 종합 점수 (100점 만점)
- ✅ AI 투자 의견 (매수/보유/매도)
- ✅ 신뢰도 지수
- ✅ 타임라인
- ✅ 1페이지 대시보드

**워크플로우**:

```
[모든 엔진 데이터 수집 - Firestore]
  ├─ 애널리스트 분석
  ├─ 매매 전략
  ├─ 매도 타이밍
  ├─ 추가 매수
  ├─ 익절/손절
  └─ 보유 기간
       ↓
[🤖 AI 요약 생성 (별도 Python 서버)]
  ├─ 핵심 포인트 추출 (상위 3-5개)
  ├─ 긍정/부정 요인 분류
  ├─ 종합 의견 생성
  └─ 신뢰도 계산
       ↓
[종합 점수 계산]
  ├─ 기술적 분석 (25점)
  ├─ 수급 분석 (20점)
  ├─ 밸류에이션 (25점)
  ├─ 애널리스트 (20점)
  └─ 모멘텀 (10점)
       ↓
[투자 의견 매핑]
  ├─ 80+ 점: 적극 매수
  ├─ 60-79점: 매수
  ├─ 40-59점: 보유
  ├─ 20-39점: 매도 검토
  └─ 0-19점: 매도
       ↓
[1페이지 리포트 생성]
  ├─ PDF 다운로드
  ├─ 이미지 공유
  └─ 웹 대시보드
```

**🤖 AI 엔진 모듈 (별도 개발)**:

- **기능**:
  - 다차원 데이터 통합 분석
  - 자연어 리포트 생성 (Claude API)
  - 시각화 데이터 생성
- **출력**: JSON 형태의 구조화된 리포트

---

## 🔥 Firebase 인프라 구성

### 1. Firebase 서비스 구성도

```
┌─────────────────────────────────────────────────────┐
│                   Firebase Platform                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  🌐 Firebase Hosting                        │    │
│  │  - React 웹 애플리케이션 호스팅              │    │
│  │  - Next.js SSR 지원                         │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔥 Cloud Firestore (NoSQL DB)              │    │
│  │  ├─ /stocks/{stockCode}                     │    │
│  │  ├─ /analyst_reports/{stockCode}/{id}       │    │
│  │  ├─ /trading_strategies/{stockCode}         │    │
│  │  ├─ /user_portfolios/{userId}               │    │
│  │  └─ /price_history/{stockCode}/{date}       │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  ⚡ Cloud Functions (서버리스 백엔드)        │    │
│  │  ├─ 데이터 수집 스케줄러 (매일 09:00)        │    │
│  │  ├─ 실시간 가격 업데이트 (WebSocket)        │    │
│  │  ├─ 신호 감지 및 알림                       │    │
│  │  ├─ 리포트 생성 트리거                      │    │
│  │  └─ AI 엔진 호출 (Cloud Run 연동)           │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  ⏰ Cloud Scheduler                         │    │
│  │  - 일일 데이터 수집 (09:00 KST)            │    │
│  │  - 리포트 크롤링 (20:00 KST)               │    │
│  │  - 백테스트 실행 (주말)                    │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔔 Cloud Messaging (FCM)                   │    │
│  │  - 매매 신호 푸시 알림                      │    │
│  │  - 목표가 도달 알림                         │    │
│  │  - 손익 알림                                │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔐 Firebase Authentication                 │    │
│  │  - 이메일/비밀번호 인증                     │    │
│  │  - Google OAuth                             │    │
│  │  - 사용자 프로필 관리                       │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  📊 Firebase Analytics                      │    │
│  │  - 사용자 행동 분석                         │    │
│  │  - 기능 사용률 추적                         │    │
│  └─────────────────────────────────────────────┘    │
│                        ↕                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  💾 Cloud Storage                           │    │
│  │  - 리포트 PDF 저장                          │    │
│  │  - 차트 이미지 저장                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│              🤖 AI 엔진 (별도 서버)                   │
│              Google Cloud Run (컨테이너)             │
├─────────────────────────────────────────────────────┤
│  - Python FastAPI 서버                               │
│  - Claude API 연동                                   │
│  - 백테스트 엔진                                     │
│  - ML 모델 서빙                                      │
└─────────────────────────────────────────────────────┘
```

### 2. Firestore 데이터 모델

#### 주요 컬렉션 구조

```javascript
// 1. 종목 기본 정보
/stocks/{stockCode}
{
  code: "005930",
  name: "삼성전자",
  market: "KOSPI",
  sector: "반도체",
  current_price: 75000,
  market_cap: 4500000000000,
  last_updated: Timestamp,

  // 기본 지표
  fundamentals: {
    per: 12.5,
    pbr: 1.8,
    roe: 15.2,
    eps: 6000,
    bps: 42000
  },

  // 기술적 지표 (최신값)
  technical: {
    rsi_14: 65,
    macd: 250,
    signal: 200,
    bb_upper: 78000,
    bb_lower: 72000,
    ma_5: 74500,
    ma_20: 73000,
    ma_60: 71000
  }
}

// 2. 가격 히스토리 (서브컬렉션)
/stocks/{stockCode}/price_history/{date}
{
  date: "2026-01-27",
  open: 74000,
  high: 75500,
  low: 73800,
  close: 75000,
  volume: 15000000,

  // 투자주체별 거래
  trading_by_investor: {
    foreign: -50000,  // 순매도
    institution: 30000,  // 순매수
    individual: 20000
  }
}

// 3. 애널리스트 리포트
/analyst_reports/{stockCode}_{reportId}
{
  stock_code: "005930",
  securities_firm: "삼성증권",
  analyst_name: "홍길동",
  report_date: Timestamp,

  target_price: 85000,
  investment_opinion: "BUY",  // BUY/HOLD/SELL

  // AI 요약
  summary: "반도체 업황 회복에 따른 실적 개선 예상...",
  key_points: ["HBM 수요 증가", "파운드리 점유율 상승"],
  sentiment: "positive",  // positive/neutral/negative

  accuracy_score: 0.85  // 과거 예측 정확도
}

// 4. 애널리스트 컨센서스
/analyst_consensus/{stockCode}
{
  stock_code: "005930",
  avg_target_price: 82000,
  median_target_price: 83000,

  opinion_distribution: {
    buy: 15,
    hold: 3,
    sell: 0
  },

  consensus_opinion: "BUY",
  report_count: 18,
  last_updated: Timestamp,

  // 최근 변화 추적
  changes: {
    target_price_change: +2000,  // 지난주 대비
    opinion_upgrades: 2,
    opinion_downgrades: 0
  }
}

// 5. 매매 전략
/trading_strategies/{stockCode}
{
  stock_code: "005930",

  // 사용자 프로필
  user_profile: {
    risk_tolerance: "moderate",
    investment_period: "mid",  // short/mid/long
    initial_capital: 10000000
  },

  // 시장 분석
  market_analysis: {
    current_phase: "bull",  // bull/bear/sideways
    volatility_level: 0.15,
    trend_strength: 0.72
  },

  // 추천 전략
  strategy: {
    type: "momentum",  // momentum/value/swing
    entry_signals: [
      {condition: "RSI < 40", current: 38, triggered: true},
      {condition: "MACD 골든크로스", triggered: true}
    ],
    exit_signals: [
      {condition: "RSI > 70", current: 65, triggered: false}
    ],
    position_size_pct: 20,  // 전체 자본의 20%
    stop_loss_pct: -8,
    take_profit_pct: 15
  },

  // 백테스트 결과
  backtest: {
    period: "2023-01-01 to 2025-12-31",
    win_rate: 0.65,
    avg_return: 12.5,
    max_drawdown: -15.2,
    sharpe_ratio: 1.8,
    total_trades: 48
  },

  last_updated: Timestamp
}

// 6. 사용자 포트폴리오
/user_portfolios/{userId}
{
  user_id: "user123",
  total_value: 50000000,
  cash: 10000000,

  holdings: [
    {
      stock_code: "005930",
      quantity: 100,
      avg_price: 72000,
      current_price: 75000,
      profit_loss: 300000,
      profit_rate: 4.17,
      weight: 14.4  // 포트폴리오 내 비중(%)
    }
  ],

  // 손익 통계
  performance: {
    total_profit: 2000000,
    total_return: 4.0,
    best_stock: "005930",
    worst_stock: "035720"
  }
}

// 7. 매도 타이밍 신호
/sell_signals/{stockCode}
{
  stock_code: "005930",

  signals: [
    {
      type: "target_price",
      description: "목표가 90% 도달",
      urgency: "medium",  // high/medium/low
      triggered_at: Timestamp
    },
    {
      type: "technical",
      description: "RSI 과매수 (72)",
      urgency: "low"
    }
  ],

  overall_urgency: "medium",

  // 분할 매도 계획
  sell_plan: [
    {level: 1, target_price: 78000, sell_pct: 30, status: "pending"},
    {level: 2, target_price: 82000, sell_pct: 30, status: "pending"},
    {level: 3, target_price: 85000, sell_pct: 40, status: "pending"}
  ]
}

// 8. 추가 매수 신호
/buy_signals/{stockCode}
{
  stock_code: "005930",

  // 추가매수 점수
  buy_score: 75,  // 0-100

  scores_breakdown: {
    technical: 22,  // 30점 만점
    supply_demand: 18,  // 25점 만점
    valuation: 20,  // 25점 만점
    analyst: 15  // 20점 만점
  },

  recommendation: "BUY",  // BUY/NEUTRAL/AVOID

  // 분할 매수 계획
  buy_plan: [
    {level: 1, target_price: 71250, amount: 3000000, status: "pending"},
    {level: 2, target_price: 67500, amount: 3000000, status: "pending"},
    {level: 3, target_price: 63750, amount: 4000000, status: "pending"}
  ]
}

// 9. 익절/손절 설정
/profit_loss_rules/{userId}_{stockCode}
{
  user_id: "user123",
  stock_code: "005930",

  entry_price: 72000,
  entry_date: Timestamp,

  // 사용자 설정
  settings: {
    risk_profile: "moderate",
    target_profit_pct: 10,
    stop_loss_pct: -10,
    trailing_stop_enabled: true,
    trailing_stop_pct: 5
  },

  // 계산된 가격
  profit_targets: [
    {level: 1, price: 77040, pct: 7, triggered: false},
    {level: 2, price: 79200, pct: 10, triggered: false},
    {level: 3, price: 81360, pct: 13, triggered: false}
  ],

  stop_loss_price: 64800,

  // 트레일링 스탑
  trailing_stop: {
    highest_price: 75500,
    current_stop: 71725  // 최고가 대비 -5%
  },

  // 알림 상태
  alerts: [
    {type: "profit_1", triggered: false},
    {type: "stop_loss_warning", triggered: false}
  ]
}

// 10. 보유 기간 추천
/holding_period/{stockCode}
{
  stock_code: "005930",

  recommended_period: {
    min_days: 30,
    optimal_days: 90,
    max_days: 180,
    reason: "중기 사이클 고려 시 3-6개월 보유 권장"
  },

  // 주요 이벤트
  key_events: [
    {
      type: "earnings",
      date: "2026-04-28",
      description: "1Q 실적 발표"
    },
    {
      type: "dividend",
      ex_date: "2026-12-28",
      pay_date: "2027-04-15"
    }
  ],

  // 체크포인트
  checkpoints: [
    {
      date: "2026-02-27",
      action: "1개월 기술적 재평가",
      status: "pending"
    },
    {
      date: "2026-04-28",
      action: "실적 발표 후 펀더멘탈 점검",
      status: "pending"
    }
  ]
}

// 11. 종합 리포트
/summary_reports/{stockCode}_{date}
{
  stock_code: "005930",
  report_date: "2026-01-27",

  // 종합 점수
  total_score: 78,  // 100점 만점

  scores: {
    technical: 20,  // 25점 만점
    supply_demand: 16,  // 20점
    valuation: 22,  // 25점
    analyst: 15,  // 20점
    momentum: 5  // 10점
  },

  // AI 투자 의견
  ai_opinion: {
    recommendation: "BUY",
    confidence: 0.82,
    summary: "반도체 업황 회복 및 HBM 수요 증가로...",

    key_points: [
      {type: "positive", point: "외국인 5일 연속 순매수"},
      {type: "positive", point: "PER 업종 평균 대비 저평가"},
      {type: "negative", point: "단기 RSI 과열 구간"}
    ]
  },

  // 타임라인
  timeline: [
    {
      date: "2026-01-28",
      event: "1차 익절 타이밍 모니터링"
    },
    {
      date: "2026-02-15",
      event: "실적 프리뷰 발표"
    }
  ],

  // 신뢰도
  reliability_score: 0.85,

  // 리포트 메타데이터
  generated_by: "StockPilot AI",
  version: "1.0"
}
```

### 3. Cloud Functions 구조

```javascript
// functions/index.js

// === 1. 데이터 수집 스케줄러 ===
exports.scheduledDataCollection = functions
  .region('asia-northeast3')  // 서울 리전
  .pubsub
  .schedule('0 9 * * 1-5')  // 평일 09:00 KST
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    // KIS API 실시간 시세 수집
    await collectStockPrices();

    // 재무 데이터 업데이트
    await updateFinancials();

    // 기술적 지표 계산
    await calculateTechnicalIndicators();

    return null;
  });

// === 2. 리포트 크롤링 스케줄러 ===
exports.scheduledReportCrawling = functions
  .region('asia-northeast3')
  .pubsub
  .schedule('0 20 * * *')  // 매일 20:00
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    await crawlAnalystReports();
    await updateConsensus();
    return null;
  });

// === 3. 실시간 가격 업데이트 트리거 ===
exports.onPriceUpdate = functions
  .region('asia-northeast3')
  .firestore
  .document('stocks/{stockCode}')
  .onUpdate(async (change, context) => {
    const stockCode = context.params.stockCode;
    const newData = change.after.data();
    const oldData = change.before.data();

    // 가격 변동률 체크
    const priceChange = (newData.current_price - oldData.current_price) / oldData.current_price;

    // 매도/매수 신호 체크
    await checkTradingSignals(stockCode, newData);

    // 익절/손절 조건 체크
    await checkProfitLossConditions(stockCode, newData);

    // 알림 전송
    if (Math.abs(priceChange) > 0.03) {  // 3% 이상 변동
      await sendPriceAlert(stockCode, priceChange);
    }

    return null;
  });

// === 4. AI 리포트 요약 트리거 ===
exports.onNewAnalystReport = functions
  .region('asia-northeast3')
  .firestore
  .document('analyst_reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();

    // Cloud Run AI 서버 호출
    const summary = await callAISummarizer(report);

    // 요약 결과 저장
    await snap.ref.update({
      summary: summary.text,
      key_points: summary.key_points,
      sentiment: summary.sentiment
    });

    return null;
  });

// === 5. 매매 전략 생성 ===
exports.generateTradingStrategy = functions
  .region('asia-northeast3')
  .https
  .onCall(async (data, context) => {
    const { stockCode, userProfile } = data;

    // 시장 데이터 수집
    const marketData = await getMarketData(stockCode);

    // Cloud Run 백테스트 엔진 호출
    const strategy = await callBacktestEngine(stockCode, userProfile, marketData);

    // 전략 저장
    await db.collection('trading_strategies').doc(stockCode).set(strategy);

    return strategy;
  });

// === 6. 알림 전송 ===
async function sendNotification(userId, title, body, data) {
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data().fcm_token;

  const message = {
    notification: { title, body },
    data,
    token: fcmToken
  };

  await admin.messaging().send(message);
}

// === 7. 매도 신호 감지 ===
async function checkTradingSignals(stockCode, stockData) {
  const strategy = await db.collection('trading_strategies').doc(stockCode).get();
  const consensus = await db.collection('analyst_consensus').doc(stockCode).get();

  const signals = [];

  // 목표가 도달 체크
  if (stockData.current_price >= consensus.data().avg_target_price * 0.9) {
    signals.push({
      type: 'target_price',
      urgency: 'high',
      message: `목표가 90% 도달 (${stockData.current_price}원)`
    });
  }

  // RSI 과매수 체크
  if (stockData.technical.rsi_14 > 70) {
    signals.push({
      type: 'technical',
      urgency: 'medium',
      message: `RSI 과매수 구간 (${stockData.technical.rsi_14})`
    });
  }

  // 신호 저장 및 알림
  if (signals.length > 0) {
    await db.collection('sell_signals').doc(stockCode).set({
      signals,
      overall_urgency: signals.some(s => s.urgency === 'high') ? 'high' : 'medium',
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    });

    // 사용자에게 알림
    // (실제로는 해당 종목을 보유한 사용자들을 찾아서 알림)
  }
}
```

### 4. Cloud Run AI 서버 구조 (Python)

```python
# ai_engine/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import anthropic
import numpy as np
import pandas as pd
from typing import List, Dict, Optional

app = FastAPI()

# Claude API 클라이언트
claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ReportSummaryRequest(BaseModel):
    report_text: str
    stock_code: str

class ReportSummaryResponse(BaseModel):
    summary: str
    key_points: List[str]
    sentiment: str  # positive/neutral/negative

@app.post("/summarize-report", response_model=ReportSummaryResponse)
async def summarize_report(request: ReportSummaryRequest):
    """애널리스트 리포트 요약"""

    prompt = f"""
    다음은 {request.stock_code} 종목에 대한 증권사 애널리스트 리포트입니다.

    리포트 내용:
    {request.report_text}

    다음 형식으로 요약해주세요:
    1. 핵심 요약 (3-5문장)
    2. 주요 투자 포인트 (3-5개)
    3. 전체적인 톤 (positive/neutral/negative)
    """

    message = claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    # 응답 파싱 (실제로는 더 정교한 파싱 필요)
    response_text = message.content[0].text

    return ReportSummaryResponse(
        summary="AI 생성 요약...",
        key_points=["포인트 1", "포인트 2"],
        sentiment="positive"
    )

class BacktestRequest(BaseModel):
    stock_code: str
    strategy_type: str
    start_date: str
    end_date: str
    initial_capital: float

@app.post("/backtest")
async def run_backtest(request: BacktestRequest):
    """백테스트 실행"""

    # 가격 데이터 로드
    price_data = load_price_data(request.stock_code, request.start_date, request.end_date)

    # 전략 실행
    if request.strategy_type == "momentum":
        results = momentum_strategy(price_data, request.initial_capital)
    elif request.strategy_type == "value":
        results = value_strategy(price_data, request.initial_capital)
    else:
        raise HTTPException(status_code=400, detail="Unknown strategy type")

    return {
        "win_rate": results["win_rate"],
        "avg_return": results["avg_return"],
        "max_drawdown": results["max_drawdown"],
        "sharpe_ratio": results["sharpe_ratio"],
        "total_trades": results["total_trades"]
    }

def momentum_strategy(price_data: pd.DataFrame, capital: float):
    """모멘텀 전략 백테스트"""

    # RSI, MACD 계산
    price_data['rsi'] = calculate_rsi(price_data['close'], 14)
    price_data['macd'], price_data['signal'] = calculate_macd(price_data['close'])

    # 매수/매도 신호 생성
    # ... (백테스트 로직)

    return {
        "win_rate": 0.65,
        "avg_return": 12.5,
        "max_drawdown": -15.2,
        "sharpe_ratio": 1.8,
        "total_trades": 48
    }

@app.post("/generate-summary-report")
async def generate_summary_report(stock_code: str):
    """종합 리포트 생성"""

    # 모든 분석 데이터 수집 (Firestore에서)
    analyst_data = get_analyst_data(stock_code)
    strategy_data = get_strategy_data(stock_code)
    technical_data = get_technical_data(stock_code)

    # Claude로 종합 의견 생성
    prompt = f"""
    다음 데이터를 바탕으로 {stock_code} 종목에 대한 종합 투자 의견을 작성해주세요.

    애널리스트 컨센서스: {analyst_data}
    기술적 분석: {technical_data}
    매매 전략: {strategy_data}

    다음을 포함해주세요:
    1. 투자 의견 (적극 매수/매수/보유/매도 검토/매도)
    2. 핵심 근거 (3-5문장)
    3. 주요 긍정 요인 (3개)
    4. 주요 부정 요인 (3개)
    5. 신뢰도 평가 (0-100)
    """

    message = claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    return {"ai_report": message.content[0].text}
```

---

## 🤖 AI 엔진 모듈 연계 계획

### 1. AI 엔진이 필요한 기능

| 기능       | AI 모델               | 용도              | 호출 빈도    |
| -------- | ------------------- | --------------- | -------- |
| 리포트 요약   | Claude Sonnet 4     | 애널리스트 리포트 핵심 추출 | 일 1-2회   |
| 감성 분석    | FinBERT (또는 Claude) | 뉴스/리포트 긍정/부정 판단 | 실시간      |
| 종합 의견 생성 | Claude Sonnet 4     | 모든 데이터 통합 분석    | 종목당 일 1회 |
| 백테스트     | 자체 알고리즘             | 전략 검증           | 주 1회     |
| 패턴 인식    | CNN/LSTM            | 차트 패턴 자동 인식     | 일 1회     |

### 2. AI 서버 배포 구조

```
┌────────────────────────────────────────┐
│     Firebase Cloud Functions           │
│  (트리거 & 오케스트레이션)               │
└────────────┬───────────────────────────┘
             │ HTTP Request
             ↓
┌────────────────────────────────────────┐
│      Google Cloud Run                  │
│  🐳 Docker Container (Python)          │
├────────────────────────────────────────┤
│  - FastAPI 서버                        │
│  - Claude API 클라이언트               │
│  - 백테스트 엔진 (Backtrader)          │
│  - ML 모델 (scikit-learn, TensorFlow)  │
│  - 기술적 지표 계산 (TA-Lib)           │
└────────────────────────────────────────┘
```

### 3. 호출 흐름 예시

```
[사용자 요청]
    ↓
[Firebase Functions: onNewReport 트리거]
    ↓
[Cloud Run AI 서버 호출]
POST https://ai-engine-xxxx.run.app/summarize-report
Body: {
  "report_text": "...",
  "stock_code": "005930"
}
    ↓
[Claude API 호출 - 리포트 분석]
    ↓
[결과 반환]
{
  "summary": "반도체 업황 회복...",
  "key_points": ["HBM 수요", "실적 개선"],
  "sentiment": "positive"
}
    ↓
[Firestore 업데이트]
    ↓
[클라이언트 실시간 반영]
```

---

## 📅 개발 로드맵 및 일정

### 전체 타임라인 (약 16-20주)

```
Week 1-3   : [Phase 1] 데이터 인프라
             └─ API 연동, Firestore 설계, 크롤러 구축

Week 4-7   : [Phase 2] 애널리스트 엔진
             └─ 리포트 수집, AI 요약, 컨센서스 계산

Week 8-11  : [Phase 3] 매매 전략 엔진
             └─ 백테스트 엔진, 전략 생성, 신호 감지

Week 12-16 : [Phase 4] 실행 엔진 그룹 (병렬 개발)
             ├─ 매도 타이밍 (Week 12-14)
             ├─ 추가 매수 (Week 12-14)
             └─ 보유 기간 (Week 15-16)

Week 17-18 : [Phase 5] 익절/손절 엔진
             └─ 실시간 모니터링, 알림 시스템

Week 19-20 : [Phase 6] 종합 리포트 엔진
             └─ AI 통합 분석, 대시보드 구축

Week 21+   : 테스트 & 최적화
```

### 주별 세부 계획

#### Week 1-3: 데이터 인프라

**Week 1**

- [ ] Firebase 프로젝트 생성 및 설정
- [ ] Firestore 데이터 모델 설계
- [ ] KIS Open API 계정 및 인증 설정
- [ ] Cloud Functions 프로젝트 초기화

**Week 2**

- [ ] 실시간 시세 수집 Functions 개발
- [ ] 가격 히스토리 저장 로직
- [ ] 네이버 금융 크롤러 개발
- [ ] DART API 연동

**Week 3**

- [ ] Cloud Scheduler 설정
- [ ] 에러 핸들링 및 재시도 로직
- [ ] 데이터 검증 및 정제 파이프라인
- [ ] 기본 테스트 및 디버깅

#### Week 4-7: 애널리스트 엔진

**Week 4**

- [ ] 증권사 리포트 크롤러 개발
- [ ] 한경컨센서스 API 연동
- [ ] 리포트 파싱 로직

**Week 5**

- [ ] Cloud Run AI 서버 구축 (FastAPI)
- [ ] Claude API 연동
- [ ] 리포트 요약 엔드포인트 개발

**Week 6**

- [ ] 컨센서스 계산 로직
- [ ] 애널리스트 정확도 추적 시스템
- [ ] Firestore 트리거 연결

**Week 7**

- [ ] 프론트엔드 연동
- [ ] 테스트 및 최적화
- [ ] 문서화

#### Week 8-11: 매매 전략 엔진

**Week 8**

- [ ] 기술적 지표 계산 모듈 (TA-Lib)
- [ ] 백테스트 프레임워크 구축
- [ ] 전략 템플릿 정의

**Week 9**

- [ ] 모멘텀 전략 구현 및 백테스트
- [ ] 가치 투자 전략 구현
- [ ] 스윙 트레이딩 전략 구현

**Week 10**

- [ ] AI 전략 생성 엔드포인트
- [ ] 시장 상황 분석 로직
- [ ] 리스크/수익 시뮬레이션

**Week 11**

- [ ] 프론트엔드 연동
- [ ] 실시간 신호 감지 Functions
- [ ] 테스트 및 검증

#### Week 12-16: 실행 엔진 그룹

**Week 12-14 (병렬 개발)**

- [ ] **매도 타이밍**: 신호 감지, 분할 매도 계획
- [ ] **추가 매수**: 점수 계산, 분할 매수 계획
- [ ] FCM 알림 시스템 구축

**Week 15-16**

- [ ] **보유 기간**: 이벤트 스케줄, 체크포인트 설정
- [ ] 통합 테스트
- [ ] 프론트엔드 UI/UX 개선

#### Week 17-18: 익절/손절 엔진

**Week 17**

- [ ] 익절/손절 계산 로직
- [ ] 트레일링 스탑 구현
- [ ] 실시간 가격 모니터링

**Week 18**

- [ ] 자동 알림 시스템
- [ ] 사용자 설정 인터페이스
- [ ] 테스트 및 검증

#### Week 19-20: 종합 리포트 엔진

**Week 19**

- [ ] 데이터 통합 로직
- [ ] AI 종합 의견 생성
- [ ] 점수 계산 알고리즘

**Week 20**

- [ ] 1페이지 대시보드 UI
- [ ] PDF/이미지 생성
- [ ] 최종 테스트

---

## 🛠️ 기술 스택 및 구현 가이드

### Frontend

```javascript
// 기술 스택
- React 18+ (또는 Next.js 14+)
- TypeScript
- Tailwind CSS
- Recharts / Chart.js (차트)
- Zustand (상태 관리)
- Firebase SDK (Auth, Firestore, FCM)

// 프로젝트 구조
src/
├── components/
│   ├── Dashboard/
│   ├── StockDetail/
│   ├── TradingStrategy/
│   └── Reports/
├── hooks/
│   ├── useFirestore.ts
│   ├── useRealtime.ts
│   └── useNotifications.ts
├── services/
│   ├── firebase.ts
│   └── api.ts
└── utils/
    ├── calculations.ts
    └── formatters.ts
```

### Backend (Firebase)

```javascript
// Cloud Functions 구조
functions/
├── src/
│   ├── schedulers/
│   │   ├── dataCollection.ts
│   │   └── reportCrawling.ts
│   ├── triggers/
│   │   ├── onPriceUpdate.ts
│   │   ├── onNewReport.ts
│   │   └── onSignalDetected.ts
│   ├── api/
│   │   ├── strategy.ts
│   │   └── report.ts
│   ├── utils/
│   │   ├── kis-api.ts
│   │   ├── crawler.ts
│   │   └── notifications.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### AI Engine (Cloud Run)

```python
# Docker 구조
ai-engine/
├── app/
│   ├── main.py
│   ├── routers/
│   │   ├── summarize.py
│   │   ├── backtest.py
│   │   └── analysis.py
│   ├── services/
│   │   ├── claude_client.py
│   │   ├── backtest_engine.py
│   │   └── technical_indicators.py
│   └── models/
│       └── schemas.py
├── Dockerfile
├── requirements.txt
└── .env.example
```

### 데이터 수집 예시 코드

```typescript
// Cloud Functions - 실시간 시세 수집
export const collectStockPrices = functions
  .region('asia-northeast3')
  .pubsub
  .schedule('*/1 * * * *')  // 매 1분
  .onRun(async () => {
    const kis = new KISOpenAPI(process.env.KIS_APP_KEY, process.env.KIS_APP_SECRET);

    const stockCodes = ['005930', '000660', '035420'];  // 샘플

    for (const code of stockCodes) {
      try {
        const price = await kis.getCurrentPrice(code);

        await admin.firestore()
          .collection('stocks')
          .doc(code)
          .update({
            current_price: price.stck_prpr,  // 현재가
            change_rate: price.prdy_ctrt,    // 전일대비율
            volume: price.acml_vol,          // 누적거래량
            last_updated: admin.firestore.FieldValue.serverTimestamp()
          });

        // 기술적 지표 업데이트 트리거
        await updateTechnicalIndicators(code);

      } catch (error) {
        console.error(`Error collecting price for ${code}:`, error);
      }
    }
  });

// 기술적 지표 계산
async function updateTechnicalIndicators(stockCode: string) {
  const priceHistory = await getPriceHistory(stockCode, 60);  // 60일

  const rsi = calculateRSI(priceHistory, 14);
  const macd = calculateMACD(priceHistory);
  const bb = calculateBollingerBands(priceHistory, 20);

  await admin.firestore()
    .collection('stocks')
    .doc(stockCode)
    .update({
      'technical.rsi_14': rsi,
      'technical.macd': macd.macd,
      'technical.signal': macd.signal,
      'technical.bb_upper': bb.upper,
      'technical.bb_lower': bb.lower
    });
}
```

### 실시간 알림 예시 코드

```typescript
// 매도 신호 감지 및 알림
export const onPriceUpdate = functions
  .region('asia-northeast3')
  .firestore
  .document('stocks/{stockCode}')
  .onUpdate(async (change, context) => {
    const stockCode = context.params.stockCode;
    const newData = change.after.data();

    // 해당 종목을 보유한 사용자 찾기
    const portfolios = await admin.firestore()
      .collection('user_portfolios')
      .where('holdings', 'array-contains', {stock_code: stockCode})
      .get();

    for (const portfolio of portfolios.docs) {
      const userId = portfolio.id;

      // 익절 조건 체크
      const profitRules = await admin.firestore()
        .collection('profit_loss_rules')
        .doc(`${userId}_${stockCode}`)
        .get();

      if (profitRules.exists) {
        const rules = profitRules.data();

        // 1차 익절가 도달
        if (newData.current_price >= rules.profit_targets[0].price && 
            !rules.profit_targets[0].triggered) {

          await sendNotification(userId, {
            title: `${newData.name} 1차 익절 타이밍!`,
            body: `목표가 도달 (현재가: ${newData.current_price}원)`,
            data: {
              type: 'profit_target',
              stock_code: stockCode,
              level: 1
            }
          });

          // 알림 상태 업데이트
          await profitRules.ref.update({
            'profit_targets.0.triggered': true
          });
        }
      }
    }
  });

async function sendNotification(userId: string, message: any) {
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .get();

  const fcmToken = userDoc.data()?.fcm_token;

  if (fcmToken) {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: message.title,
        body: message.body
      },
      data: message.data,
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    });
  }
}
```

---

## 📊 개발 우선순위 매트릭스 (최종)

| 순위  | 엔진      | 중요도   | 난이도 | 기간  | AI 연계 | 의존성   |
| --- | ------- | ----- | --- | --- | ----- | ----- |
| 0   | 데이터 인프라 | ⭐⭐⭐⭐⭐ | 중   | 3주  | ❌     | 없음    |
| 1   | 애널리스트   | ⭐⭐⭐⭐⭐ | 중   | 4주  | ✅     | 0     |
| 2   | 매매 전략   | ⭐⭐⭐⭐⭐ | 상   | 4주  | ✅     | 0, 1  |
| 3-1 | 매도 타이밍  | ⭐⭐⭐⭐⭐ | 중   | 3주  | ❌     | 1, 2  |
| 3-2 | 추가 매수   | ⭐⭐⭐⭐⭐ | 중   | 3주  | ❌     | 1, 2  |
| 3-3 | 보유 기간   | ⭐⭐⭐⭐  | 중   | 2주  | ❌     | 1, 2  |
| 4   | 익절/손절   | ⭐⭐⭐⭐  | 하   | 2주  | ❌     | 3-1   |
| 5   | 요약 리포트  | ⭐⭐⭐⭐⭐ | 중   | 2주  | ✅     | 모든 엔진 |

**전체 개발 기간: 약 20주 (5개월)**

---

## 🎯 성공 지표 (KPI)

### 기술적 지표

- [ ] 실시간 데이터 업데이트 지연 < 1분
- [ ] API 응답 시간 < 500ms
- [ ] Cloud Functions 실행 성공률 > 99%
- [ ] 일일 데이터 수집 완료율 100%

### 기능적 지표

- [ ] 애널리스트 컨센서스 정확도 > 80%
- [ ] 매매 신호 적중률 > 60%
- [ ] 백테스트 샤프 비율 > 1.5
- [ ] 사용자 알림 전송 성공률 > 95%

### 사용자 경험

- [ ] 페이지 로딩 속도 < 2초
- [ ] 모바일 최적화 완료
- [ ] 리포트 생성 시간 < 5초
- [ ] 직관적 UI/UX 점수 > 4.5/5

---

## 📚 참고 자료

### API 문서

- [한국투자증권 KIS Open API](https://apiportal.koreainvestment.com/)
- [DART 공시 API](https://opendart.fss.or.kr/)
- [네이버 금융 크롤링 가이드](https://finance.naver.com/)

### 기술 문서

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Cloud Functions 가이드](https://firebase.google.com/docs/functions)
- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

### 투자 전략

- [기술적 분석 기초](https://en.wikipedia.org/wiki/Technical_analysis)
- [백테스트 방법론](https://www.quantstart.com/articles/Backtesting-Trading-Strategies/)
- [리스크 관리](https://www.investopedia.com/terms/r/riskmanagement.asp)

---

## 🚀 다음 단계

1. **즉시 실행**
   
   - [ ] Firebase 프로젝트 생성
   - [ ] Git 저장소 초기화
   - [ ] KIS API 계정 생성
   - [ ] 개발 환경 설정

2. **1주일 내**
   
   - [ ] Firestore 스키마 확정
   - [ ] Cloud Functions 템플릿 작성
   - [ ] 첫 데이터 수집 테스트

3. **1개월 내**
   
   - [ ] 데이터 인프라 완성
   - [ ] 애널리스트 엔진 프로토타입
   - [ ] AI 서버 기본 구조 구축

---

**문서 버전**: 1.0  
**작성일**: 2026-01-27  
**작성자**: StockPilot AI 개발팀  
**검토자**: Claude (Anthropic)

---

## 부록: 용어 정리

| 용어              | 설명                                    |
| --------------- | ------------------------------------- |
| Firebase        | Google의 모바일/웹 앱 개발 플랫폼                |
| Firestore       | NoSQL 클라우드 데이터베이스                     |
| Cloud Functions | 서버리스 백엔드 함수                           |
| Cloud Run       | 컨테이너 기반 서버리스 플랫폼                      |
| FCM             | Firebase Cloud Messaging (푸시 알림)      |
| KIS API         | 한국투자증권 Open API                       |
| RSI             | Relative Strength Index (상대강도지수)      |
| MACD            | Moving Average Convergence Divergence |
| 백테스트            | 과거 데이터로 전략 성능 검증                      |
| 샤프 비율           | 위험 대비 수익률 지표                          |
| MDD             | Maximum Drawdown (최대 낙폭)              |
