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
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.nextUrl.protocol === 'https:'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Chỉ ép Secure: true nếu đang thực sự ở môi trường PRODUCTION hoặc là https CHUẨN (không phải localhost)
            // Localhost dùng Http nên nếu ép Secure: true thì trình duyệt sẽ reject cookie.
            const isLocalhost = request.nextUrl.hostname === 'localhost'
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isHttps && !isLocalhost ? true : options.secure,
              // sameSite: 'lax', // Đảm bảo ổn định khi redirect từ VNPay về
            })
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Bỏ qua tất cả các route API để cho phép webhook VNPay và các gọi nội bộ chạy bình thường
  const isApiPage = pathname.startsWith('/api')

  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path))

  const isPublicPage = isApiPage || PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === path : pathname.startsWith(path)
  )

  const isAdminPage = pathname.startsWith('/admin')

  const isResetPasswordPage =
    request.nextUrl.pathname.startsWith('/reset-password')

  if (!user && !isAuthPage && !isResetPasswordPage && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'

    const redirectResponse = NextResponse.redirect(url)
    copyCookiesToResponse(supabaseResponse, redirectResponse)

    return redirectResponse
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'

    const redirectResponse = NextResponse.redirect(url)
    copyCookiesToResponse(supabaseResponse, redirectResponse)

    return redirectResponse
  }

  if (user && isAdminPage) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'

      const redirectResponse = NextResponse.redirect(url)
      copyCookiesToResponse(supabaseResponse, redirectResponse)

      return redirectResponse
    }
  }

  return supabaseResponse
}
