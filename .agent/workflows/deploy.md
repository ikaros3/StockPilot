---
description: Firebase Hosting에 배포합니다
---
# Firebase 배포

Next.js 애플리케이션을 Firebase Hosting에 배포합니다.

## 사전 요구사항

1. Firebase CLI 설치: `npm install -g firebase-tools`
2. Firebase 로그인: `firebase login`
3. `.env.local`에 Firebase 설정 입력

## 단계

// turbo
1. 프로덕션 빌드
```bash
npm run build
```

// turbo
2. Firebase 배포
```bash
firebase deploy --only hosting
```

## GitHub Actions 자동 배포

`main` 브랜치에 푸시하면 자동으로 배포됩니다.
- 설정 파일: `.github/workflows/firebase-deploy.yml`

## 배포 URL

배포 후 콘솔에 표시되는 URL에서 확인:
- `https://[프로젝트ID].web.app`
- `https://[프로젝트ID].firebaseapp.com`
