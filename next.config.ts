import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run(GCP) 및 Firebase Hosting Frameworks 최적화 빌드 모드
  output: 'standalone',

  // Turbopack/Webpack의 서브패키지 해싱 오류를 방지하기 위해 
  // 루트 패키지와 주요 서브경로를 모두 외부화 목록에 명시합니다. (정석적인 다중 레이어 보안)
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/firestore',
    'firebase-admin/auth'
  ],

  async headers() {
    const securityHeaders = [
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'unsafe-none',
      },
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none',
      },
    ];
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
