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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isHttps || process.env.NODE_ENV === 'production' ? true : options.secure,
            })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path))

  const isPublicPage = PUBLIC_PATHS.some((path) =>
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
