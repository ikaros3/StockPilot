import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase Hosting 'webframeworks'는 Next.js 빌드를 직접 수행하므로, 
  // 표준 패키징을 방해하는 serverExternalPackages 등은 명시하지 않는 것이 정석입니다.
  // 이전에 성공적으로 작동했던 '깨끗한' 설정으로 원복합니다.

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
