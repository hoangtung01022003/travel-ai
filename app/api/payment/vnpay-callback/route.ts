import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCallback } from '@/lib/payment/vnpay'

/**
 * GET /api/payment/vnpay-callback
 *
 * Browser redirect from VNPay after user completes payment.
 * ALWAYS verify signature FIRST before touching any data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query: Record<string, string> = {}
  searchParams.forEach((value, key) => { query[key] = value })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase   = createAdminClient() as any
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin

  const now        = new Date().toISOString()

  // ─── 1. Verify signature ──────────────────────────────────────────────────

  const result = verifyCallback(query)

  // Always log callback for audit (fire-and-forget)
  supabase.from('payment_logs').insert({
    booking_id:     result.transactionRef || null,
    source:         'callback',
    raw_query:      query,
    response_code:  result.responseCode,
    is_valid_sig:   result.isValid,
    created_at:     now,
  }).then(({ error }: { error: { message: string } | null }) => {
    if (error) console.warn('[vnpay-callback] log error:', error.message)
  })

  if (!result.isValid) {
    console.error('[vnpay-callback] Invalid signature', query)
    return NextResponse.redirect(`${baseUrl}/payment/fail?reason=invalid_signature`)
  }

  const { responseCode, transactionRef } = result

  // ─── 2. Find booking ──────────────────────────────────────────────────────

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, payment_status, status')
    .eq('id', transactionRef)
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[vnpay-callback] Booking not found:', transactionRef)
    return NextResponse.redirect(`${baseUrl}/payment/fail?reason=booking_not_found`)
  }

  // ─── 3. Idempotency check ─────────────────────────────────────────────────

  if (booking.payment_status === 'paid') {
    // Already processed — just redirect to success
    return NextResponse.redirect(`${baseUrl}/payment/success?ref=${transactionRef}`)
  }

  // ─── 4. Update booking ────────────────────────────────────────────────────

  if (responseCode === '00') {
    // Payment success
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status:         'confirmed',
        payment_ref:    query.vnp_TransactionNo ?? transactionRef,
        paid_at:        now,
        updated_at:     now,
      })
      .eq('id', transactionRef)

    return NextResponse.redirect(`${baseUrl}/payment/success?ref=${transactionRef}`)
  } else {
    // Payment failed
    await supabase
      .from('bookings')
      .update({
        payment_status: 'unpaid',
        status:         'cancelled',
        updated_at:     now,
      })
      .eq('id', transactionRef)

    return NextResponse.redirect(
      `${baseUrl}/payment/fail?ref=${transactionRef}&code=${responseCode}`
    )
  }
}
