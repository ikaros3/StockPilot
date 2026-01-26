import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin 관련 모듈을 서버 외부 패키지로 지정
  // Turbopack/Webpack이 번들링하지 않고 런타임에 로드
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/firestore',
    'firebase-admin/auth',
  ],

  // Turbopack 설정 (Next.js 15+)
  turbopack: {
    // 필요 시 추가 설정
    resolveAlias: {
      // firebase-admin 모듈 경로 명시 (맹글링 방지)
    }
  },

  // Webpack 설정 (빌드 시 사용)
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // 서버 빌드 시 firebase-admin을 외부 모듈로 처리
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-admin/app': 'commonjs firebase-admin/app',
        'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
        'firebase-admin/auth': 'commonjs firebase-admin/auth',
      });
    }
    return config;
  },

  // CORS 헤더 설정
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
