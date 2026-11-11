import Link from 'next/link'
import { MapPin, Mail, Phone, Globe, Video, Compass } from 'lucide-react'
import { APP_NAME, NAV_ITEMS } from '@/lib/constants/common'

export default function Footer() {
  return (
    <footer className="bg-[#12302a] border-accent relative border-t-4 text-[#f7f3ec]">
      <div className="pattern-dots pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-accent text-[#12302a] flex h-9 w-9 rotate-45 items-center justify-center rounded-md">
                <Compass className="h-5 w-5 -rotate-45" />
              </div>
              <span className="font-display ml-1 text-2xl font-semibold">{APP_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/60">
              Nền tảng du lịch thông minh giúp bạn khám phá vẻ đẹp Việt Nam. Tìm
              kiếm điểm đến, khách sạn và nhận gợi ý lịch trình từ AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-accent mb-4 text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-sans)' }}>Khám phá</h3>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/60 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-accent mb-4 text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-sans)' }}>Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-white/60">
                  Hướng dẫn đặt tour
                </span>
              </li>
              <li>
                <span className="text-sm text-white/60">
                  Câu hỏi thường gặp
                </span>
              </li>
              <li>
                <span className="text-sm text-white/60">
                  Chính sách bảo mật
                </span>
              </li>
              <li>
                <span className="text-sm text-white/60">
                  Điều khoản sử dụng
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-accent mb-4 text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-sans)' }}>Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="h-4 w-4 shrink-0" />
                contact@viettravel.vn
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="h-4 w-4 shrink-0" />
                1900 1234
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 shrink-0" />
                Hà Nội, Việt Nam
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:text-accent">
                <Globe className="h-4 w-4" />
              </div>
              <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:text-accent">
                <Video className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
