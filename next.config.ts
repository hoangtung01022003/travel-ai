import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactCompiler: true,
  images: {
    // Next 16 chỉ cho phép các mức quality được khai báo ở đây
    qualities: [75, 85, 90],
    formats: ['image/avif', 'image/webp'],
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
