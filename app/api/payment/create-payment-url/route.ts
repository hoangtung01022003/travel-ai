import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPaymentUrl } from '@/lib/payment/vnpay'

export async function POST(request: Request) {
  try {
    // ─── 1. Auth ─────────────────────────────────────────────────────────────

    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── 2. Parse input ───────────────────────────────────────────────────────

    const body = await request.json()
    const { booking_id, amount, order_desc } = body as {
      booking_id: string
      amount:     number
      order_desc: string
    }

    if (!booking_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'booking_id và amount là bắt buộc' },
        { status: 400 }
      )
    }

    // ─── 3. Validate booking ──────────────────────────────────────────────────

    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: bookingErr } = await (supabase as any)
      .from('bookings')
      .select('id, user_id, payment_status, total_price')
      .eq('id', booking_id)
      .maybeSingle()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking không tồn tại' }, { status: 404 })
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking đã được thanh toán' }, { status: 409 })
    }

    // ─── 4. Get client IP and Base URL ────────────────────────────────────────

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp  = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin

    // ─── 5. Create payment URL ────────────────────────────────────────────────

    const paymentUrl = createPaymentUrl({
      bookingId:  booking_id,
      amount:     amount,
      orderDesc:  order_desc || `Thanh toan tour - ${booking_id.slice(0, 8)}`,
      clientIp,
      baseUrl
    })

    return NextResponse.json({ paymentUrl })

  } catch (err) {
    console.error('[create-payment-url]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
