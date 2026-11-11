'use client'

import { motion } from 'framer-motion'
import { MapPin, Sparkles, ArrowRight, CalendarDays, Hotel, Route } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const POPULAR = ['Đà Nẵng', 'Phú Quốc', 'Hội An', 'Sapa', 'Nha Trang', 'Đà Lạt']

export default function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-[#12302a] text-[#f7f3ec]" style={{ backgroundColor: '#12302a' }}>
      {/* Ảnh nền Vịnh Hạ Long + zoom chậm */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=75&auto=format')",
        }}
        initial={{ scale: 1.15 }}
        animate={{ scale: [1.15, 1.05, 1.15] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Lớp phủ để chữ đọc rõ: đậm bên trái, nhạt dần sang phải */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#12302a] via-[#12302a]/85 to-[#12302a]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#12302a]/70 via-transparent to-transparent" />
      <div className="pattern-dots absolute inset-0 opacity-30" />
      <div className="bg-secondary/25 absolute -top-32 -right-24 h-96 w-96 rounded-full blur-3xl" />
      <div className="bg-accent/15 absolute -bottom-40 left-1/3 h-80 w-80 rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow mb-6" style={{ color: '#e9c77b' }}>Du lịch Việt Nam thông minh</span>

            <h1 className="mb-6 text-4xl leading-[1.1] font-semibold text-[#f7f3ec] sm:text-5xl lg:text-6xl">
              Mỗi vùng đất
              <br />
              một <span className="italic text-[#e0a93b]">câu chuyện</span> riêng
            </h1>

            <p className="mb-10 max-w-xl text-base leading-relaxed text-[#e6dfd1] sm:text-lg">
              Tìm điểm đến, chọn khách sạn ưng ý, đặt tour trọn gói và để AI
              sắp xếp lịch trình từng ngày cho chuyến đi của bạn.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button size="lg" variant="secondary" className="h-12 rounded-full px-6 text-base" asChild>
              <Link href="/destinations">
                <MapPin className="mr-1 h-4 w-4" />
                Khám phá điểm đến
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-[#f7f3ec]/30 bg-transparent px-6 text-base text-[#f7f3ec] hover:bg-[#f7f3ec]/10 hover:text-[#f7f3ec]"
              asChild
            >
              <Link href="/ai-planner">
                <Sparkles className="mr-1 h-4 w-4" />
                Lên lịch trình với AI
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 text-xs tracking-[0.15em] text-[#b9b2a3] uppercase">
              Phổ biến
            </span>
            {POPULAR.map((place) => (
              <button
                key={place}
                onClick={() =>
                  router.push(`/destinations?keyword=${encodeURIComponent(place)}`)
                }
                className="cursor-pointer rounded-full border border-[#f7f3ec]/30 px-3 py-1 text-sm text-[#f7f3ec] transition-colors hover:border-[#e0a93b] hover:bg-[#e0a93b] hover:text-[#12302a]"
              >
                {place}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Right: postcard */}
        <motion.div
          initial={{ opacity: 0, rotate: 0, y: 24 }}
          animate={{ opacity: 1, rotate: 2, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-md border border-[#e0a93b]/60" />
          <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-[#fffaf0] via-[#fbf1e1] to-[#f3e3c8] text-[#1f2a27] shadow-2xl">
            {/* Header strip */}
            <div className="relative flex items-center justify-between bg-gradient-to-r from-[#b5432a] to-[#d0643f] px-7 py-5 text-[#fffaf0]">
              <div className="pattern-dots pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                <p className="text-xs tracking-[0.18em] text-[#f6dca0] uppercase">
                  Lịch trình gợi ý
                </p>
                <p className="font-display text-2xl font-semibold">Hội An · 3 ngày</p>
              </div>
              <div className="relative flex h-14 w-14 -rotate-12 items-center justify-center rounded-full border-2 border-double border-[#f6dca0] bg-[#12302a]/30 text-xs font-bold tracking-wider text-[#f6dca0]">
                AI
              </div>
            </div>

            <div className="px-7 pt-6 pb-7">
              <ul className="relative space-y-5">
                <span className="absolute top-2 bottom-2 left-[17px] w-0.5 bg-gradient-to-b from-[#0f5c4d] via-[#c9932b] to-[#b5432a]" />
                {[
                  { icon: Route, title: 'Ngày 1', text: 'Phố cổ, chùa Cầu, thả đèn hoa đăng', color: '#0f5c4d', tint: '#e3efe9' },
                  { icon: Hotel, title: 'Ngày 2', text: 'Rừng dừa Bảy Mẫu, biển An Bàng', color: '#b07a12', tint: '#faf1dc' },
                  { icon: CalendarDays, title: 'Ngày 3', text: 'Làng gốm Thanh Hà, ẩm thực địa phương', color: '#b5432a', tint: '#f8e7e1' },
                ].map(({ icon: Icon, title, text, color, tint }) => (
                  <li key={title} className="relative flex gap-4">
                    <div
                      className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md ring-4"
                      style={{ backgroundColor: color, ['--tw-ring-color' as string]: tint }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-md border-l-4 bg-white/70 px-3 py-2" style={{ borderColor: color }}>
                      <p className="text-sm font-semibold" style={{ color }}>{title}</p>
                      <p className="text-sm text-[#4a4a42]">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href="/ai-planner"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0f5c4d] px-5 py-2.5 text-sm font-semibold text-[#fffaf0] shadow-md transition-colors hover:bg-[#b5432a]"
              >
                Tạo lịch trình của bạn
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Wave divider */}
      <svg
        className="relative block h-10 w-full text-[var(--background)]"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 40 C 360 0 1080 0 1440 40 Z" fill="currentColor" />
      </svg>
    </section>
  )
}
