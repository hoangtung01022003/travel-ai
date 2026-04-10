import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error === 'access_denied' || errorCode === 'otp_expired') {
    return NextResponse.redirect(`${appUrl}/link-expired`)
  }

  if (code) {
    // ✅ Tạo response trước, rồi gắn cookie vào response này
    const redirectResponse = NextResponse.redirect(
      redirectTo ? `${appUrl}${redirectTo}` : appUrl
    )

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // ✅ Set cookie trực tiếp vào redirectResponse
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: exchangeError,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      if (
        exchangeError.message?.includes('expired') ||
        exchangeError.code === 'otp_expired'
      ) {
        return NextResponse.redirect(`${appUrl}/link-expired`)
      }
      return NextResponse.redirect(`${appUrl}/login`)
    }

    // Role-based default redirect
    let nextPath = redirectTo || '/'

    if (!redirectTo && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role || 'user'

      // Sync role to user_metadata for middleware performance
      await supabase.auth.updateUser({
        data: { role }
      })

      if (role === 'admin') {
        nextPath = '/admin'
      }
    }

    // Update redirect URL in redirectResponse
    const finalRedirectUrl = new URL(nextPath, appUrl).toString()
    const finalResponse = NextResponse.redirect(finalRedirectUrl)

    // Copy cookies from redirectResponse to finalResponse
    redirectResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
      })
    })

    return finalResponse
  }

  return NextResponse.redirect(redirectTo ? `${appUrl}${redirectTo}` : appUrl)
}