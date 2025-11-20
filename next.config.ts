import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
        port: '',
        pathname: '/marketing-cms/assets/images/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '70mb',
    },
  },
};

export default nextConfig;
