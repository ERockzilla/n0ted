import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'purecatamphetamine.github.io',
        pathname: '/country-flag-icons/**',
      },
    ],
  },
};

export default nextConfig;
