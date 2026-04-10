'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Shield,
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

  useEffect(() => {
    let cancelled = false

    // Timeout an toàn: nếu sau 8s vẫn chưa resolve thì tắt loading
    const timeout = setTimeout(() => {
      if (!cancelled) setAuthLoading(false)
    }, 8000)

    // Dùng onAuthStateChange làm nguồn sự thật DUY NHẤT
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      // console.log('Auth Event Header:', event, session?.user?.id)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (!cancelled && data) {
            setUser(data)
          }
        } else {
          if (!cancelled) {
            setUser(null)
          }
        }
        if (!cancelled) setAuthLoading(false)
      } else if (event === 'SIGNED_OUT') {
        if (!cancelled) {
          setUser(null)
          setAuthLoading(false)
        }
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
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${scrolled
          ? 'border-border border-b bg-white/95 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-gradient text-xl font-bold">{APP_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
                      ? 'text-primary'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="bg-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full"
                    />
                  )}
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
                    <Avatar className="border-primary/20 h-9 w-9 border-2">
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
                    <Heart className="mr-2 h-4 w-4" />
                    Lịch trình AI
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
                <Button size="sm" asChild>
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
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted'
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
