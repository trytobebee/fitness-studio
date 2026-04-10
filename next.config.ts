import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  turbopack: {},
  allowedDevOrigins: ['192.168.0.100'],
};

export default nextConfig;
