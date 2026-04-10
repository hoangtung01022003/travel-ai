import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Server-side Sign-out Route
 * Giúp xóa cookie an toàn ở tầng server và redirect ngay lập tức,
 * tránh xung đột session ở client-side.
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  // Kiểm tra session hiện tại
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('next') || '/'

  // Redirect về trang chủ hoặc trang yêu cầu
  return NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 302,
  })
}

// Hỗ trợ cả GET nếu muốn sign out qua link (nhưng POST vẫn là chuẩn hơn)
export async function GET(request: Request) {
  return POST(request)
}
