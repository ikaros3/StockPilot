import type { NextConfig } from "next";


const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    turbopack: {
      rules: {
        // Configure rules here if needed, empty to silence error
      }
    }
  },
  webpack: (config, { isServer }) => {
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
