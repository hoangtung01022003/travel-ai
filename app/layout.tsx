import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Lora, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/sonner'

const bodyFont = Be_Vietnam_Pro({
  variable: '--font-sans',
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
})

const displayFont = Lora({
  variable: '--font-display',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'VietTravel - Khám phá Việt Nam',
  description:
    'Nền tảng du lịch thông minh - Tìm kiếm điểm đến, khách sạn và nhận gợi ý lịch trình từ AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} antialiased flex min-h-full flex-col`}
      >
        {children}
        <Toaster richColors={false} position="top-right" expand />
      </body>
    </html>
  )
}
