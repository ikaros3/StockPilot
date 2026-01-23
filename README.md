# StockPilot 📈

개인 투자자용 포트폴리오 분석 및 리포팅 플랫폼

## 🚀 Getting Started (Development / 개발 가이드)

이 프로젝트는 **Next.js**와 **Firebase Emulator**를 함께 사용하여 개발합니다.
포트 충돌 방지 및 안정적인 API 동작을 위해 **터미널 2개를 사용하여 실행**하는 것을 권장합니다.

### 1. 사전 준비 (Prerequisites)
- [Node.js](https://nodejs.org/) (LTS 권장)
- Firebase CLI: `npm install -g firebase-tools`
- 프로젝트 의존성 설치:
  ```bash
  npm install
  ```

### 2. 개발 서버 실행 (Run)

안정적인 개발을 위해 **백엔드(Emulator)**와 **프론트엔드(Next.js)**를 분리하여 실행합니다.

#### Terminal 1: Firebase Emulators (Backend)
Firestore(DB)와 Authentication(인증) 에뮬레이터를 실행합니다.
(Hosting 기능을 제외하여 5000번 포트 충돌을 방지합니다)
```bash
npm run emulators
```
- **Auth**: [localhost:9099](http://localhost:9099)
- **Firestore**: [localhost:8080](http://localhost:8080)
- **Emulator UI**: [localhost:4000](http://localhost:4000)

#### Terminal 2: Next.js (Frontend & API)
웹 서버와 내부 API를 실행합니다.
```bash
npm run dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)

### 3. 문제 해결 (Troubleshooting)

**"Port xxxx is already in use" 에러 발생 시:**
이전 실행된 프로세스가 제대로 종료되지 않았을 수 있습니다. 터미널에서 다음 명령어로 포트를 정리하세요.

```powershell
npx kill-port 3000 5000 8080 9099 4000 5002
```

---

## 📚 About Frameworks

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Learn More about Next.js
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
