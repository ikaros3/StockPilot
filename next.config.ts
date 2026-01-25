import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Firebase Framework-aware 배포를 위한 핵심 설정
  serverExternalPackages: ['firebase-admin'],
  // Turbopack 관련 설정 정돈
  turbopack: {
    rules: {
    },
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
