import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPaymentUrl } from '@/lib/payment/vnpay'

/**
 * GET /api/payment/retry?id={booking_id}
 *
 * Cho phép user thử thanh toán lại một booking đang ở trạng thái unpaid/pending.
 * - Verify user đang login và là chủ booking
 * - Kiểm tra booking chưa paid
 * - Tạo lại VNPay payment URL và redirect thẳng
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('id')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin

  // ─── 1. Validate params ───────────────────────────────────────────────────

  if (!bookingId) {
    return NextResponse.redirect(`${baseUrl}/my-tours?error=missing_booking_id`)
  }

  // ─── 2. Auth check ────────────────────────────────────────────────────────

  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?next=/my-tours`)
  }

  // ─── 3. Fetch booking (dùng admin client để bypass RLS, tự check ownership) ─

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, user_id, payment_status, status, total_price, tour_id, hotel_id, booking_type')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[retry] Booking not found:', bookingId)
    return NextResponse.redirect(`${baseUrl}/my-tours?error=booking_not_found`)
  }

  // ─── 4. Ownership check ───────────────────────────────────────────────────

  if (booking.user_id !== user.id) {
    return NextResponse.redirect(`${baseUrl}/my-tours?error=forbidden`)
  }

  // ─── 5. Guard: không retry nếu đã paid hoặc refunded ─────────────────────

  if (booking.payment_status === 'paid') {
    return NextResponse.redirect(`${baseUrl}/my-tours?error=already_paid`)
  }

  if (['refunded', 'cancelled'].includes(booking.status)) {
    return NextResponse.redirect(`${baseUrl}/my-tours?error=booking_cancelled`)
  }

  // ─── 6. Lấy IP client ─────────────────────────────────────────────────────

  const forwarded = request.headers.get('x-forwarded-for')
  const clientIp  = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'

  // ─── 7. Build item name cho order_desc ────────────────────────────────────

  let itemName = 'Đặt chỗ'
  try {
    if (booking.booking_type === 'hotel' && booking.hotel_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: hotel } = await (supabase as any)
        .from('hotels')
        .select('name')
        .eq('id', booking.hotel_id)
        .maybeSingle()
      if (hotel?.name) itemName = `Khach san ${hotel.name}`
    } else if (booking.tour_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tour } = await (supabase as any)
        .from('tours')
        .select('name')
        .eq('id', booking.tour_id)
        .maybeSingle()
      if (tour?.name) itemName = `Tour ${tour.name}`
    }
  } catch {
    // ignore — dùng fallback itemName
  }

  // ─── 8. Tạo VNPay URL và redirect ─────────────────────────────────────────

  const paymentUrl = createPaymentUrl({
    bookingId: booking.id,
    amount:    Number(booking.total_price),
    orderDesc: `Thanh toan lai - ${itemName} - ${booking.id.slice(0, 8)}`,
    clientIp,
    baseUrl
  })

  return NextResponse.redirect(paymentUrl)
}
