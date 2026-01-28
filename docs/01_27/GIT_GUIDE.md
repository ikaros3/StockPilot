# Git 추적 관리 가이드 (Git Tracking Guide)

이 문서는 프로젝트의 안정적인 버전 관리와 협업을 위해 `.gitignore`에 포함되어야 할 항목과 반드시 커밋(Track)되어야 할 항목을 정의합니다.

## 1. `.gitignore`에 반드시 포함되어야 할 항목 (Ignore)
이 항목들은 저장소(Repository)에 올라가면 안 되는 파일입니다.

### 🚫 보안 및 로컬 설정 (Security & Local Config)
- `.env*`: API 키, 비밀번호 등 민감 정보를 담고 있습니다. **절대 커밋하면 안 됩니다.**
  - 예외: `.env.example` (민감 정보가 제거된 템플릿)은 커밋하여 다른 개발자가 참고할 수 있게 해야 합니다.

### 📦 의존성 모듈 (Dependencies)
- `node_modules/`: 용량이 매우 크고 `package.json`으로 재설치 가능하므로 커밋하지 않습니다.

### 🏗️ 빌드 및 생성물 (Build Outputs)
- `.next/`: Next.js 빌드 결과물.
- `out/`: 정적 내보내기 결과물.
- `build/`: 일반적인 빌드 폴더.
- `dist/`: 배포용 생성물.

### 🐛 디버그 로그 및 시스템 파일 (Logs & System)
- `*.log`: `npm-debug.log`, `yarn-error.log`, `firebase-debug.log`, `firestore-debug.log` 등.
- `.DS_Store` (macOS), `Thumbs.db` (Windows): 운영체제 자동 생성 파일.
- `.vscode/`, `.idea/`: 개발자 개인의 IDE 설정 파일 (단, 팀 공통 설정인 `settings.json` 등은 합의 하에 커밋 가능).

### 🔥 Firebase 에뮬레이터 데이터
- `.firebase/`: 호스팅 에뮬레이터 캐시 등.

---

## 2. 반드시 커밋에 포함되어야 할 항목 (Track)
이 항목들이 누락되면 다른 환경에서 프로젝트가 정상 작동하지 않습니다.

### ⚙️ 프로젝트 설정 (Project Configuration)
- `package.json`: 프로젝트 메타데이터 및 의존성 목록.
- `package-lock.json` (또는 `yarn.lock`, `pnpm-lock.yaml`): **매우 중요.** 의존성 버전을 정확히 고정하여 모든 환경에서 동일한 패키지가 설치되도록 보장합니다. **이 파일이 없거나 커밋되지 않으면 "내 컴퓨터에선 되는데..." 문제가 발생합니다.**
- `tsconfig.json`: TypeScript 컴파일 설정.
- `next.config.ts`: Next.js 설정.
- `firebase.json`: 호스팅, Firestore, 관련 설정.
- `.firebaserc`: Firebase 프로젝트 별칭(Alias) 설정.
- `firestore.rules`, `firestore.indexes.json`: DB 보안 규칙 및 인덱스 설정.

### 📂 소스 코드 및 정적 파일
- `src/`: 모든 소스 코드.
- `public/`: 이미지, 폰트 등 정적 자산 (단, 빌드 시 생성되는 파일 제외).

### 📝 문서
- `README.md`, `docs/`: 프로젝트 설명서.

## 3. 체크리스트 (브랜치 변경/커밋 전 확인)
- [ ] `git status`로 의도치 않은 파일이 포함되었거나, 중요한 파일이 누락되었는지 확인.
- [ ] `package-lock.json`이 변경되었다면 `package.json` 변경사항과 일치하는지 확인.
- [ ] `.env` 파일이 실수로 추가되지 않았는지 확인.

## 4. 자주 묻는 질문 (FAQ)

### Q1. `.env.local`도 설정 파일인데 커밋해야 하지 않나요?
**A: 절대 안 됩니다.**
`.env` 파일에는 API Key, DB 비밀번호, JWT Secret 등 **외부에 유출되면 안 되는 보안 정보**가 포함되어 있습니다.
대신, 변수명(Key)만 적혀있고 값(Value)은 비워둔 `.env.example` 파일을 커밋하여, 다른 개발자가 어떤 환경 변수가 필요한지 알 수 있게 해야 합니다.

### Q2. `node_modules`가 없으면 프로젝트가 실행이 안 되는데, 커밋해야 하지 않나요?
**A: 커밋하지 않는 것이 원칙입니다.**
1.  **용량 문제**: 수백 MB ~ GB 단위로, 저장소 용량을 불필요하게 차지합니다.
2.  **호환성 문제**: 일부 라이브러리는 설치된 운영체제(Windows/Mac/Linux)에 맞는 **바이너리 파일(C++ 등)**을 포함합니다. 내가 Windows에서 커밋한 `node_modules`를 Mac 사용자가 받으면 실행되지 않습니다.
3.  **해결책**: `package.json`과 `package-lock.json`이 "설치할 목록"을 정확히 담고 있습니다. 이 파일들만 있으면 `npm install` 명령어로 누구나 똑같은 `node_modules`를 생성할 수 있습니다.
    *   *비유: 요리법(package.json)만 공유하면 누구나(npm install) 똑같은 요리(node_modules)를 만들 수 있습니다. 다 만든 요리를 택배로 보낼 필요가 없습니다.*
