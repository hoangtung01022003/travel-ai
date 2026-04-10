import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-full flex-col`}
      >
        {children}
        <Toaster richColors={false} position="top-right" expand />
      </body>
    </html>
  )
}
