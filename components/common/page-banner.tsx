import type { LucideIcon } from 'lucide-react'

interface PageBannerProps {
  eyebrow: string
  title: string
  highlight: string
  description: string
  icon: LucideIcon
}

export function PageBanner({ eyebrow, title, highlight, description, icon: Icon }: PageBannerProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-md bg-[#12302a] px-6 py-10 text-[#f7f3ec] sm:px-10 lg:py-14">
      <div className="pattern-dots pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-[#b5432a]/30 blur-3xl" />
      <Icon
        className="pointer-events-none absolute -right-6 -bottom-8 h-48 w-48 rotate-12 text-[#e0a93b]/10"
        strokeWidth={1}
      />
      <div className="relative max-w-2xl">
        <span className="eyebrow mb-4" style={{ color: '#e9c77b' }}>
          {eyebrow}
        </span>
        <h1 className="mb-3 text-3xl font-semibold text-[#f7f3ec] lg:text-5xl">
          {title} <span className="italic text-[#e0a93b]">{highlight}</span>
        </h1>
        <p className="text-[#e6dfd1]">{description}</p>
      </div>
    </div>
  )
}
