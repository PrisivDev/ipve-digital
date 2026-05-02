import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-66cf8584-611c-4059-901f-5a34a5f70f9c.space.z.ai",
    "preview-chat-223a3f50-747e-4b58-90c1-4820fb65aa1d.space.z.ai",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
};

export default nextConfig;
