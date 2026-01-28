# Firebase 설정 가이드

이 문서는 StockPilot 애플리케이션에서 Firebase를 설정하고 사용하는 방법을 설명합니다.

## 📋 목차

1. [Firebase 개요](#firebase-개요)
2. [Firestore 데이터 스키마](#firestore-데이터-스키마)
3. [로컬 개발 (Emulator)](#로컬-개발-emulator)
4. [프로덕션 배포](#프로덕션-배포)
5. [환경 변수 설정](#환경-변수-설정)

---

## Firebase 개요

StockPilot은 다음 Firebase 서비스를 사용합니다:

| 서비스 | 용도 |
|--------|------|
| **Firebase Authentication** | 사용자 인증 (이메일/비밀번호, Google OAuth) |
| **Cloud Firestore** | 포트폴리오, 보유 종목, 알림 데이터 저장 |
| **Firebase Hosting** | 프로덕션 배포 (선택) |

---

## Firestore 데이터 스키마

### 컬렉션 구조

```
firestore/
├── users/                    # 사용자 정보
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL?: string
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
│
├── portfolios/               # 포트폴리오
│   └── {portfolioId}/
│       ├── userId: string (인덱스)
│       ├── name: string
│       ├── description?: string
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
│
├── holdings/                 # 보유 종목
│   └── {holdingId}/
│       ├── portfolioId: string (인덱스)
│       ├── stockCode: string
│       ├── stockName: string
│       ├── purchasePrice: number
│       ├── quantity: number
│       ├── purchaseDate: Timestamp
│       ├── additionalPurchases: AdditionalPurchase[]
│       │   └── { price, quantity, date }
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
│
├── analysisReports/          # 분석 리포트 (캐시)
│   └── {reportId}/
│       ├── holdingId: string
│       ├── stockCode: string
│       ├── reportType: string
│       ├── data: object
│       ├── generatedAt: Timestamp
│       └── expiresAt: Timestamp
│
└── alerts/                   # 알림
    └── {alertId}/
        ├── userId: string (인덱스)
        ├── type: 'price' | 'target' | 'stop_loss' | 'rebalance'
        ├── stockCode?: string
        ├── message: string
        ├── isRead: boolean
        ├── priority: 'low' | 'medium' | 'high'
        ├── createdAt: Timestamp
        └── readAt?: Timestamp
```

### 타입 정의

```typescript
// 포트폴리오
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 보유 종목
interface Holding {
  id: string;
  portfolioId: string;
  stockCode: string;           // 예: "005930"
  stockName: string;           // 예: "삼성전자"
  purchasePrice: number;       // 평균 매수가
  quantity: number;            // 총 보유 수량
  purchaseDate: Timestamp;     // 최초 매수일
  additionalPurchases: {       // 추가 매수 이력
    price: number;
    quantity: number;
    date: Timestamp;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 알림
interface Alert {
  id: string;
  userId: string;
  type: 'price' | 'target' | 'stop_loss' | 'rebalance';
  stockCode?: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

---

## 로컬 개발 (Emulator)

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인 및 초기화

```bash
# 로그인
firebase login

# 프로젝트 초기화 (이미 설정된 경우 생략)
firebase init

# 선택 항목:
# - Firestore
# - Emulators (Authentication, Firestore)
```

### 3. Emulator 시작

```bash
# Emulator 시작
npm run firebase:emulators

# 또는 직접 실행
firebase emulators:start
```

### 4. Emulator UI 접속

- **Emulator Suite UI**: http://localhost:4000
- **Firestore UI**: http://localhost:4000/firestore
- **Auth UI**: http://localhost:4000/auth

### 5. 앱에서 Emulator 연결

앱이 Emulator를 자동 감지하려면 `.env.local`에 다음을 추가:

```env
# Emulator 사용 여부
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

---

## 프로덕션 배포

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: stockpilot-prod)
4. Google Analytics 설정 (선택)
5. 프로젝트 생성 완료

### 2. Authentication 설정

1. Firebase Console → Authentication → Sign-in method
2. 다음 로그인 제공자 활성화:
   - **이메일/비밀번호**: 활성화
   - **Google**: 활성화 (OAuth 클라이언트 ID 자동 생성)

### 3. Firestore 설정

1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드**로 시작
4. 위치 선택: `asia-northeast3` (서울)

### 4. 보안 규칙 배포

```bash
firebase deploy --only firestore:rules
```

### 5. 환경 변수 설정

Firebase Console → 프로젝트 설정 → 일반 → 내 앱 → 웹 앱에서 설정값 복사

---

## 환경 변수 설정

### `.env.local` 파일

```env
# =============================================================================
# Firebase 설정
# =============================================================================

# Emulator 사용 여부 (로컬 개발 시 true)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# Firebase 프로젝트 설정 (프로덕션 배포 시 필요)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# =============================================================================
# 기타 설정 (이미 설정됨)
# =============================================================================

# DART API
DART_API_KEY=your_dart_api_key

# KIS API
KIS_ENVIRONMENT=vts
KIS_PROD_APP_KEY=...
KIS_VTS_APP_KEY=...
```

### 설정값 없을 때 동작

| 상태 | 동작 |
|------|------|
| `USE_FIREBASE_EMULATOR=true` | Firebase Emulator 사용 |
| 환경 변수 있음 | 실제 Firebase 사용 |
| 환경 변수 없음 | LocalStorage 폴백 |

---

## 개발 워크플로우

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   로컬 개발     │ ──> │   테스트/QA     │ ──> │   프로덕션      │
│  (Emulator)     │     │  (Emulator)     │     │  (Firebase)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
   LocalStorage            LocalStorage            Firestore
   + Emulator              + Emulator              (클라우드)
```

---

## 다음 단계

1. ✅ Firebase CLI 설치
2. ✅ Emulator 설정
3. [ ] 앱에서 Emulator 연결 코드 추가
4. [ ] E2E 테스트 작성
5. [ ] 프로덕션 Firebase 프로젝트 생성
6. [ ] 환경 변수 설정 및 배포
