'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MapPin,
  Landmark,
  Hotel,
  Route,
  Tags,
  Users,
  MessageSquare,
  Bot,
  Receipt,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  MapPin,
  Landmark,
  Hotel,
  Route,
  Tags,
  Users,
  MessageSquare,
  Receipt,
  Bot,
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: 'LayoutDashboard' },
  { href: '/admin/destinations', label: 'Điểm đến', icon: 'MapPin' },
  { href: '/admin/attractions', label: 'Tham quan', icon: 'Landmark' },
  { href: '/admin/hotels', label: 'Khách sạn', icon: 'Hotel' },
  { href: '/admin/tours', label: 'Tour', icon: 'Route' },
  { href: '/admin/tags', label: 'Tags', icon: 'Tags' },
  { href: '/admin/users', label: 'Users', icon: 'Users' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'Receipt' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'MessageSquare' },
  { href: '/admin/ai-logs', label: 'AI Logs', icon: 'Bot' },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">VietTravel</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold">Admin</span>
        </div>
        {/* Mobile nav could be added here with a drawer */}
      </div>

      {/* Mobile top-bar spacer */}
      <div className="h-14 lg:hidden" />
    </>
  )
}
