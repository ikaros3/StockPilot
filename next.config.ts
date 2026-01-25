import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack에서 firebase-admin 패키지를 외부 모듈로 명확히 처리하도록 강제합니다.
  // 이 설정은 프로덕션 및 개발 환경 모두에서 모듈 분석 오류를 방지하는 표준적인 방식입니다.
  serverExternalPackages: ['firebase-admin'],

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
