import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  serverExternalPackages: ['bcryptjs', 'sharp'],
  allowedDevOrigins: ['*'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
};

export default nextConfig;
