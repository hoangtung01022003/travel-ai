'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Bot, Calendar, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  { icon: Bot, title: 'AI thông minh', text: 'Hiểu sở thích, ngân sách và nhịp độ chuyến đi của bạn.' },
  { icon: Calendar, title: 'Chi tiết từng ngày', text: 'Lịch trình sáng – trưa – tối kèm gợi ý ẩm thực.' },
  { icon: Heart, title: 'Lưu lịch trình', text: 'Lưu lại, xem lại và chỉnh sửa bất cứ lúc nào.' },
]

export const CtaSection = () => {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-secondary text-secondary-foreground relative mx-auto grid max-w-6xl overflow-hidden rounded-md lg:grid-cols-2"
      >
        <div className="pattern-dots pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative z-10 px-8 py-14 lg:px-14 lg:py-16">
          <span className="eyebrow mb-5 !text-[#f6dca0]">Tính năng AI</span>
          <h2 className="mb-5 text-3xl leading-tight font-semibold lg:text-[2.75rem]">
            Để AI lên kế hoạch cho
            <span className="italic"> chuyến đi trong mơ</span>
          </h2>
          <p className="mb-8 max-w-md text-base text-white/80">
            Chỉ cần mô tả mong muốn, AI sẽ tạo lịch trình chi tiết từng ngày
            kèm gợi ý ẩm thực, chi phí ước tính và mẹo du lịch.
          </p>
          <Button
            size="xl"
            className="bg-card text-secondary hover:bg-accent hover:text-[#12302a] h-12 rounded-full px-7 text-base shadow-lg"
            asChild
          >
            <Link href="/ai-planner">
              Thử ngay AI Planner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="bg-[#12302a]/25 relative z-10 flex flex-col justify-center gap-px">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className="flex items-start gap-5 border-b border-white/10 px-8 py-7 last:border-0 lg:px-12"
            >
              <span className="font-display text-accent text-3xl leading-none font-semibold">
                0{i + 1}
              </span>
              <div>
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4" />
                  {title}
                </div>
                <p className="text-sm text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
