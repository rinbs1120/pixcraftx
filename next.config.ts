import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/supabase-storage/:path*',
        destination: 'https://eurbsafbkffdnfmvcddy.supabase.co/storage/:path*',
      },
    ];
  },
};

export default nextConfig;