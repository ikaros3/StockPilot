# Firestore 기반 회원가입 / 로그인 Workflow

이 문서는 **Firebase Authentication + Firestore**를 사용하는
일반적인 웹서비스의 회원가입, 로그인, 최초 로그인(Onboarding) 워크플로우를 정리한 문서입니다.

---

## 1. 기본 아키텍처 개요

### 사용 기술

- Firebase Authentication
  - Google OAuth
  - Kakao OAuth (Custom OAuth 또는 Firebase Custom Token)
  - Email / Password
- Firestore (사용자 상태 및 서비스 데이터 저장)

### 핵심 원칙

- **인증(Authentication)**: Firebase Auth 담당
- **사용자 상태 / 프로필**: Firestore 담당
- Auth는 “로그인 가능 여부”만 관리
- Firestore는 “서비스 사용자 상태”를 관리

---

## 2. Firestore 사용자 데이터 구조

### Collection: `users`



## 3. 회원가입 Workflow

### 3-1. 소셜 회원가입 (Google / Kakao)

[회원가입 버튼 클릭]
   ↓
[Firebase Auth OAuth 인증]
   ↓
[인증 성공 → UID 발급]
   ↓
[Firestore users/{uid} 조회]
   ├─ 존재 → 기존 유저 (로그인 처리)
   └─ 없음 → 신규 유저 문서 생성



Google / Kakao는 이메일이 이미 인증된 상태로 간주



3-2. 이메일 / 비밀번호 회원가입



[회원가입 폼 제출]
   ↓
[Firebase Auth createUserWithEmailAndPassword]
   ↓
[UID 생성]
   ↓
[이메일 인증 메일 발송]
   ↓
[Firestore users/{uid} 문서 생성]
   ↓
[이메일 인증 완료 대기]





## 4. 로그인 Workflow

### 4-1. 소셜 로그인

[Google / Kakao 로그인]
   ↓
[Firebase Auth 인증 성공]
   ↓
[UID 획득]
   ↓
[Firestore users/{uid} 조회]
   ├─ 없음 → 신규 회원 처리
   └─ 있음 → lastLoginAt 업데이트



### 4-2. 이메일 / 비밀번호 로그인

[이메일 / 비밀번호 입력]
   ↓
[Firebase Auth signInWithEmailAndPassword]
   ↓
[이메일 인증 여부 확인]
   ↓
[Firestore users/{uid} 조회]



이메일 미인증 시 로그인 차단 또는 인증 유도 페이지 이동



5. 로그인 이후 공통 분기 (Onboarding)

[로그인 성공]
   ↓
[Firestore users/{uid} 로드]
   ↓
[isOnboarded 확인]
   ├─ false → Welcome / Onboarding 페이지
   └─ true  → 메인 페이지



## 6. Onboarding (Welcome Page) Workflow



[Welcome Page]
   ↓

- 닉네임 설정
- 관심사 선택
- 기본 설정
   ↓
  [완료 버튼]
   ↓
  [users/{uid}.isOnboarded = true]
   ↓
  [메인 페이지 이동]



- 온보딩 중 이탈해도 다시 로그인 시 Welcome 페이지로 진입



7. 전체 통합 Workflow 다이어그램

[Sign Up / Login]
        │
        ▼
[Firebase Authentication]
        │
        ▼
[UID 발급]
        │
        ▼
[Firestore users/{uid}]
        │
        ▼
[isOnboarded ?]
    ├─ false → Welcome
    └─ true  → Main



## 8. Firestore 실무 체크리스트

### 데이터 구조

- users 문서 ID = auth.uid

- 로그인 시 users 문서 존재 여부 항상 검증

### 보안

- Firestore Security Rules
  
  - 본인 문서만 read/write 허용

- isOnboarded 임의 수정 방지

### 운영

- lastLoginAt 매 로그인 시 업데이트

- provider 변경 정책 명확히 정의

---

## 9. 확장 포인트

- 소셜 계정 연결

- 회원 탈퇴 (Auth + Firestore 동시 삭제)

- Role 기반 권한 관리

- Soft Delete (`deletedAt`)
