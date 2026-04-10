import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_PATHS, PUBLIC_PATHS } from '@/lib/constants/common'

const copyCookiesToResponse = (
  source: NextResponse,
  target: NextResponse
): void => {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value)
  })
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const headers = request.headers

  // 1. ƯU TIÊN 1: Asset & API Bypass (Không tốn tài nguyên)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico') ||
    headers.get('next-action')
  ) {
    return NextResponse.next()
  }

  // 2. ƯU TIÊN 2: Prefetch Bypass (Tránh log lặp và lãng phí request)
  if (
    headers.get('x-middleware-prefetch') === '1' || 
    headers.get('purpose') === 'prefetch'
  ) {
    return NextResponse.next()
  }

  // 3. CHIẾN THUẬT QUAN TRỌNG: Lazy Auth cho trang Public
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path))
  const isPublicPage = PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === path : pathname.startsWith(path)
  )
  const isResetPasswordPage = pathname.startsWith('/reset-password')
  const isAdminPage = pathname.startsWith('/admin')

  // Nếu là trang Public (Trang chủ, Tours, v.v.) và KHÔNG PHẢI trang Auth/Admin
  // Chúng ta Bypass hoàn toàn việc gọi getUser() ở đây để triệt tiêu Race Condition
  if (isPublicPage && !isAuthPage && !isAdminPage && !isResetPasswordPage) {
    // Tốc độ: ~0ms network request
    return NextResponse.next()
  }

  // 4. Khởi tạo Supabase (Chỉ khi cần check Auth cho trang Private/Admin/Auth)
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isHttps =
    headers.get('x-forwarded-proto') === 'https' ||
    request.nextUrl.protocol === 'https:'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const isLocalhost = request.nextUrl.hostname === 'localhost'
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isHttps && !isLocalhost ? true : options.secure,
            })
          })
        }
      },
    }
  )

  // 5. CHỈ thực hiện getUser() cho các route nhạy cảm với cơ chế Timeout
  const startTime = Date.now()
  let user = null

  try {
    // Sử dụng Promise.race để tránh việc Middleware treo quá lâu khi mạng Ngrok bị nghẽn
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth Timeout')), 15000)
      ) as Promise<any>
    ])
    user = data?.user
  } catch (error) {
    console.error('⚠️ MIDDLEWARE AUTH ERROR/TIMEOUT:', pathname, error instanceof Error ? error.message : error)
    // Nếu timeout hoặc lỗi, ta để user = null để tránh treo request. 
    // Các trang bảo mật sẽ tự động redirect về login hoặc báo lỗi ở tầng component.
  }

  const duration = Date.now() - startTime
  if (duration > 2000) {
    console.warn(`⚠️ EXTREMELY SLOW AUTH: ${pathname} took ${duration}ms`)
  } else {
    console.log(`MIDDLEWARE AUTH: ${pathname} (${duration}ms) - ${user ? 'Authenticated' : 'Guest'}`)
  }

  // 6. Guest protection (Redirect to login)
  if (!user && !isAuthPage && !isResetPasswordPage && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)

    const redirectResponse = NextResponse.redirect(url)
    copyCookiesToResponse(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  // 7. Authenticated Logic (Redirects & Admin Protection)
  if (user) {
    const userRole = user.user_metadata?.role || 'user'
    const isAdmin = userRole === 'admin'

    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/admin' : '/'

      const redirectResponse = NextResponse.redirect(url)
      copyCookiesToResponse(supabaseResponse, redirectResponse)
      return redirectResponse
    }

    if (isAdminPage && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'

      const redirectResponse = NextResponse.redirect(url)
      copyCookiesToResponse(supabaseResponse, redirectResponse)
      return redirectResponse
    }
  }

  return supabaseResponse
}
