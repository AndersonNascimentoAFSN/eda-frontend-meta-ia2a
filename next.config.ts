import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb', // Permitir arquivos até 200MB
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000']
    }
  }
};

export default nextConfig;
