import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // experimental: {
  //   allowedDevOrigins: ['192.168.232.1', 'localhost:3000'],
  // } as any,
}

export default nextConfig
