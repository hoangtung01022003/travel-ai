'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  Heart,
  Map,
  Star,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV_ITEMS } from '@/lib/constants/common'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  User,
  Heart,
  Map,
  Star,
  Sparkles,
}

export const FeatureSideBar = () => {
  const pathname = usePathname()

  return (
    <aside className="border-border flex min-h-screen w-64 flex-col border-r bg-white">
      <div className="border-border border-b p-6">
        <h2 className="text-lg font-bold">Tài khoản</h2>
        <p className="text-muted-foreground text-sm">Quản lý hồ sơ của bạn</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* <div className="border-border border-t p-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div> */}
    </aside>
  )
}
