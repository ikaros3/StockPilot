import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run/Firebase Hosting 환경에서 라이브러리 간섭을 원천 차단하기 위해
  // 루트 패키지뿐만 아니라 모든 서브 경로를 명시적으로 외부화합니다.
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/firestore',
    'firebase-admin/auth'
  ],

  // Next.js 15+ / 16 Turbopack 특정 설정은 그대로 유지 (성공 버전 기반)
  turbopack: {
    rules: {
    }
  },

  // Webpack 빌드 시에도 간섭하지 않도록 처리
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.externals.push('firebase-admin');
    }
    return config;
  },

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
