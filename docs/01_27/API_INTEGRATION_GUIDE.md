# API 연동 가이드

StockPilot에서 사용하는 외부 API 설정 방법을 안내합니다.

---

## 1. DART OpenAPI (금융감독원 전자공시시스템)

### 제공 데이터
- 기업 개황 (회사명, 업종, 대표자 등)
- 재무제표 (재무상태표, 손익계산서, 현금흐름표)
- 공시 정보 (정기공시, 주요사항공시)

### API 키 발급 방법

1. **DART OpenAPI 홈페이지 접속**
   - https://opendart.fss.or.kr

2. **회원가입**
   - 우측 상단 "Login" → "회원가입"
   - 이메일, 비밀번호 입력

3. **인증키 신청**
   - 로그인 후 "인증키 신청/관리" → "인증키 신청"
   - 사용 환경: 웹/앱
   - 사용 용도: 개인 공부/투자 분석

4. **이메일 인증**
   - 발송된 이메일의 인증 링크 클릭

5. **API 키 확인**
   - "인증키 신청/관리" → "오픈API 이용현황"
   - 40자 문자열 API 키 확인

### 환경 변수 설정

```bash
# .env.local
DART_API_KEY=your_dart_api_key_here
```

### 사용량 제한
- 일일 호출 한도: **10,000건**

---

## 2. 한국투자증권 KIS OpenAPI

### 제공 데이터
- 실시간/현재가 조회
- 일별/분별 시세
- 호가 정보
- 계좌 잔고 조회
- 주문 (매수/매도)

### API 키 발급 방법

1. **한국투자증권 계좌 개설**
   - 모바일 앱으로 비대면 개설 가능
   - https://securities.koreainvestment.com

2. **ID 연결**
   - 계좌 개설 후 ID 등록 및 연결

3. **KIS Developers 서비스 신청**
   - 한국투자증권 홈페이지 → "KIS Developers"
   - 또는 https://apiportal.koreainvestment.com

4. **App Key / App Secret 발급**
   - KIS Developers 로그인 후 신청
   - 알림톡으로 임시 비밀번호 발송

5. **모의투자 계좌 신청 (권장)**
   - 실전투자 전 모의투자로 테스트

### 환경 변수 설정

```bash
# .env.local
KIS_APP_KEY=your_kis_app_key
KIS_APP_SECRET=your_kis_app_secret
KIS_ACCOUNT_NUMBER=12345678-01
KIS_ENVIRONMENT=vts  # 모의투자: vts, 실전투자: prod
```

### 인증 방식
- OAuth 2.0 (Client Credentials)
- 액세스 토큰 유효기간: 24시간

### 주의사항
- 토큰 발급 시 등록된 휴대폰으로 알림톡 발송
- 서비스 신청일로부터 1년간 유효

---

## 3. 네이버 금융 크롤링

### 제공 데이터
- 종목 개요 (현재가, 시가총액, PER, PBR 등)
- 애널리스트 리포트
- 목표주가
- 뉴스

### 설정 방법
- **별도 API 키 불필요**
- 크롤링 간격 설정 가능

### 환경 변수 설정

```bash
# .env.local
NAVER_CRAWL_DELAY=1  # 크롤링 간격 (초)
```

### 주의사항
- 과도한 요청 시 IP 차단 가능
- 적절한 딜레이 설정 권장 (1초 이상)
- 상업적 용도 사용 시 이용약관 확인 필요

---

## 환경 변수 파일 예시

`.env.local` 파일을 프로젝트 루트에 생성하세요:

```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 한국투자증권 KIS OpenAPI
KIS_APP_KEY=your_kis_app_key
KIS_APP_SECRET=your_kis_app_secret
KIS_ACCOUNT_NUMBER=12345678-01
KIS_ENVIRONMENT=vts

# DART OpenAPI
DART_API_KEY=your_dart_api_key

# 네이버 금융 크롤링
NAVER_CRAWL_DELAY=1
```

---

## 서비스 사용 예시

### DART 서비스

```typescript
import { dartService } from "@/services/market-data";

// 기업 정보 조회
const companyInfo = await dartService.getCompanyInfo("005930");

// 재무제표 조회
const financials = await dartService.getFinancialStatements("005930", "2025");

// 공시 정보 조회
const disclosures = await dartService.getDisclosures("005930");

// 재무 비율 계산
const ratios = await dartService.getFinancialRatios("005930", 78000);
```

### KIS 서비스

```typescript
import { kisService } from "@/services/market-data";

// 현재가 조회
const price = await kisService.getCurrentPrice("005930");

// 일별 시세 조회
const dailyPrices = await kisService.getDailyPrices("005930");

// 호가 조회
const orderBook = await kisService.getOrderBook("005930");

// 계좌 잔고 조회
const balance = await kisService.getAccountBalance();
```

### 네이버 크롤러

```typescript
import { naverCrawler } from "@/services/market-data";

// 종목 개요 조회
const overview = await naverCrawler.getStockOverview("005930");

// 애널리스트 리포트 조회
const reports = await naverCrawler.getAnalystReports("005930");

// 컨센서스 조회
const consensus = await naverCrawler.getConsensus("005930");

// 뉴스 조회
const news = await naverCrawler.getNews("005930", 10);
```

---

## API 키 미설정 시 동작

모든 서비스는 API 키가 설정되지 않은 경우 **목 데이터**를 반환합니다.  
이를 통해 API 키 없이도 개발 및 UI 테스트가 가능합니다.

```typescript
// API 키 설정 여부 확인
if (kisService.isConfigured()) {
  // 실제 API 호출
} else {
  // 목 데이터 반환
}
```
