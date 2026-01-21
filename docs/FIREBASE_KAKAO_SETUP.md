# Firebase OIDC (Kakao) 설정 가이드

StockPilot 프로젝트에서 카카오 로그인을 사용하기 위해 필요한 Firebase Console 및 카카오 개발자 센터 설정 방법입니다.

## 1. 카카오 개발자 센터 설정 (Kakao Developers)

1.  [Kakao Developers](https://developers.kakao.com/)에 접속하여 로그인합니다.
2.  **내 애플리케이션 > 애플리케이션 추가하기**를 눌러 앱을 생성합니다.
3.  생성된 앱의 **앱 키** 메뉴에서 **REST API 키**를 확인합니다. (이것이 Client ID가 됩니다.)
4.  **카카오 로그인** 메뉴에서 상태를 `ON`으로 활성화합니다.
5.  **카카오 로그인 > 보안** 메뉴에서 **Client Secret** 코드를 생성하고 확인합니다. (상태를 `ON`으로 설정)
6.  **플랫폼 > Web** 메뉴에서 사이트 도메인을 등록합니다.
    *   로컬 개발용: `http://localhost:3000`
    *   Firebase 호스팅용: `https://YOUR-PROJECT-ID.firebaseapp.com`
    *   Firebase Auth 도메인: `https://YOUR-PROJECT-ID.firebaseapp.com` (리다이렉트 문제 방지)

## 2. Firebase Console 설정

1.  [Firebase Console](https://console.firebase.google.com/)에 접속하여 프로젝트를 선택합니다.
2.  **Authentication > Sign-in method** 탭으로 이동합니다.
3.  **새 제공업체 추가(Add new provider)**를 클릭하고 **OpenID Connect**를 선택합니다.
4.  설정 화면에서 다음 정보를 입력합니다:
    *   **이름(Name):** `kakao` (코드에서 `oidc.kakao`로 참조하므로 소문자 `kakao` 권장, 또는 아래 제공업체 ID 확인)
    *   **Client ID:** 카카오 개발자 센터의 **REST API 키**
    *   **Issuer (URL):** `https://kauth.kakao.com`
    *   **Client Secret:** 카카오 개발자 센터의 **Client Secret** 키
5.  **제공업체 ID(Provider ID)**가 `oidc.kakao`인지 확인합니다. (만약 다르면 코드 수정 필요)
    *   *Tip:* 이름을 `kakao`로 하면 보통 `oidc.kakao`가 됩니다.
6.  **저장(Save)**을 클릭합니다.

## 3. 리다이렉트 URI 설정 (중요)

1.  Firebase Console의 OpenID Connect 설정 창에 있는 **콜백 URL(Callback URL)**을 복사합니다.
    *   형식: `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
2.  다시 **Kakao Developers**로 돌아갑니다.
3.  **카카오 로그인 > Redirect URI** 메뉴로 이동합니다.
4.  **Redirect URI 등록**을 클릭하고, 복사한 Firebase 콜백 URL을 붙여넣고 저장합니다.

## 4. (선택) 동의 항목 설정

1.  **Kakao Developers > 카카오 로그인 > 동의항목** 메뉴로 이동합니다.
2.  **닉네임(프로필 정보)**과 **이메일**을 **필수 동의** 또는 **선택 동의**로 설정합니다.
    *   *주의:* 이메일을 받아오려면 카카오 비즈니스 채널 인증이 필요할 수 있습니다. 개발 단계에서는 선택 동의로 테스트 가능합니다.
3.  Firebase 코드에서는 `provider.addScope('openid')`와 `provider.addScope('email')`을 사용하고 있습니다.

## 5. 테스트

1.  로컬 개발 서버(`npm run dev`)를 실행합니다.
2.  로그인 페이지에서 "카카오로 로그인" 버튼을 클릭합니다.
3.  카카오 로그인 팝업이 뜨고 로그인이 진행되는지 확인합니다.

---

**참고:** `firebase-debug.log` 또는 브라우저 콘솔에 `auth/operation-not-allowed` 에러가 뜨면 Firebase Console에서 해당 OIDC 제공업체가 `Enabled` 상태인지 다시 확인하세요.
