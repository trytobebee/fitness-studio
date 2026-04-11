import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  allowedDevOrigins: ['10.0.0.9', '192.168.0.100', 'localhost', '127.0.0.1'],
};

export default nextConfig;
