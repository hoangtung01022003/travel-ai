'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants/common'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils/common'
import type { Profile } from '@/types/user'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Header({ serverProfile = null }: { serverProfile?: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<Profile | null>(serverProfile)
  const [authLoading, setAuthLoading] = useState(!serverProfile)
  const [scrolled, setScrolled] = useState(false)

  // useMemo: tạo client 1 lần duy nhất, tránh useEffect re-run mỗi render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Đồng bộ lại khi server layout render lại (sau login/logout, router.refresh)
  const [prevServerProfile, setPrevServerProfile] = useState(serverProfile)
  if (serverProfile !== prevServerProfile) {
    setPrevServerProfile(serverProfile)
    if (serverProfile) {
      setUser(serverProfile)
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const timeout = setTimeout(() => {
      if (!cancelled) setAuthLoading(false)
    }, 5000)

    const buildFallback = (u: SupabaseUser): Profile =>
      ({
        id: u.id,
        email: u.email ?? '',
        full_name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || '',
        role: (u.user_metadata?.role as Profile['role']) || 'user',
        phone: null,
        avatar_url: null,
        status: 'active',
        created_at: u.created_at,
        updated_at: u.created_at,
      }) as unknown as Profile

    const loadProfile = async (sessionUser: SupabaseUser) => {
      // Hiển thị ngay tên từ metadata, sau đó mới cập nhật từ bảng profiles
      setUser((prev) => (prev && prev.id === sessionUser.id ? prev : buildFallback(sessionUser)))
      setAuthLoading(false)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle()
      if (!cancelled && data) setUser(data)
    }

    // QUAN TRỌNG: không được await truy vấn Supabase trực tiếp trong callback
    // onAuthStateChange (gây deadlock khiến header treo, không hiện tên user).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthLoading(false)
        return
      }
      if (session?.user) {
        const u = session.user
        setTimeout(() => {
          if (!cancelled) loadProfile(u)
        }, 0)
      } else if (event === 'INITIAL_SESSION') {
        setUser(null)
        setAuthLoading(false)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    setAuthLoading(true)
    try {
      // Chuyển sang dùng server route để xử lý logout và dọn dẹp cookie triệt để
      window.location.href = '/api/auth/sign-out'
    } catch (error) {
      console.error('Sign out failed:', error)
      setAuthLoading(false)
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 border-b transition-all duration-300 ${scrolled
          ? 'border-border bg-background/95 shadow-[0_6px_24px_-12px_rgba(18,48,42,0.25)] backdrop-blur-md'
          : 'border-border/60 bg-background'
        }`}
    >
      <div className="bg-[#12302a] text-accent hidden h-7 items-center justify-center text-[11px] tracking-[0.2em] uppercase sm:flex">
        Hành trình Việt Nam · Gợi ý lịch trình bằng AI
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="bg-primary text-accent ring-accent/40 flex h-10 w-10 rotate-45 items-center justify-center rounded-md ring-2 ring-offset-2 ring-offset-background transition-transform group-hover:rotate-[135deg]">
              <Compass className="h-5 w-5 -rotate-45" />
            </div>
            <span className="font-display text-primary text-2xl font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="border-border bg-card hidden items-center gap-1 rounded-full border p-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                      ? 'text-primary-foreground'
                      : 'text-foreground/75 hover:text-secondary'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="bg-primary absolute inset-0 -z-10 rounded-full"
                    />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Auth area — skeleton while loading, then user or login buttons */}
            {authLoading ? (
              // Skeleton placeholder prevents flash of login buttons
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
                    <Avatar className="border-accent h-9 w-9 border-2">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        {getInitials(user.full_name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">
                      {user.full_name || user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{user.full_name || 'User'}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/my-tours')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Tour đã đặt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/itineraries')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Lịch trình AI
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Yêu thích
                  </DropdownMenuItem>

                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full px-4" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="hover:bg-muted rounded-lg p-2 transition-colors lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-border border-t py-4 lg:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`border-l-2 px-4 py-3 text-sm font-medium transition-colors ${isActive
                        ? 'border-secondary bg-secondary-light text-secondary'
                        : 'text-foreground/75 hover:bg-muted border-transparent'
                      }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  )
}
