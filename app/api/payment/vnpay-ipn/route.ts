import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCallback } from '@/lib/payment/vnpay'

/**
 * POST /api/payment/vnpay-ipn
 *
 * Server-to-server IPN from VNPay (not from browser).
 * VNPay expects a specific JSON response — wrong format = IPN keeps retrying.
 *
 * ALWAYS:
 * 1. Verify signature first
 * 2. Idempotency: skip if already paid
 * 3. Return exact format VNPay expects
 */
export async function GET(request: Request) {
  return handleIPN(request)
}

export async function POST(request: Request) {
  return handleIPN(request)
}

async function handleIPN(request: Request) {
  const { searchParams } = new URL(request.url)
  const query: Record<string, string> = {}
  searchParams.forEach((value, key) => { query[key] = value })

  // Also handle POST body (form-urlencoded or JSON)
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (request.method === 'POST') {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text()
        new URLSearchParams(text).forEach((value, key) => { query[key] = value })
      } else if (contentType.includes('application/json')) {
        const body = await request.json()
        Object.assign(query, body)
      }
    }
  } catch {
    // Body parse error — continue with query params only
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const now      = new Date().toISOString()

  // ─── 1. Verify signature ──────────────────────────────────────────────────

  const result = verifyCallback(query)

  // Log IPN (fire-and-forget, never block response)
  supabase.from('payment_logs').insert({
    booking_id:     result.transactionRef || null,
    source:         'ipn',
    raw_query:      query,
    response_code:  result.responseCode,
    is_valid_sig:   result.isValid,
    created_at:     now,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).then(({ error }: { error: any }) => {
    if (error) console.warn('[vnpay-ipn] log error:', error.message)
  })

  if (!result.isValid) {
    console.error('[vnpay-ipn] Invalid signature')
    return NextResponse.json({ RspCode: '97', Message: 'Invalid signature' })
  }

  const { responseCode, transactionRef } = result

  // ─── 2. Find booking ──────────────────────────────────────────────────────

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, payment_status, total_price')
    .eq('id', transactionRef)
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[vnpay-ipn] Booking not found:', transactionRef)
    return NextResponse.json({ RspCode: '01', Message: 'Order not found' })
  }

  // ─── 3. Idempotency ───────────────────────────────────────────────────────

  if (booking.payment_status === 'paid') {
    // Already processed — VNPay spec: return success to stop retries
    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' })
  }

  // ─── 4. Validate amount ───────────────────────────────────────────────────

  const expectedAmount = Number(booking.total_price)
  if (result.amount !== expectedAmount) {
    console.error(
      '[vnpay-ipn] Amount mismatch:',
      { expected: expectedAmount, received: result.amount }
    )
    return NextResponse.json({ RspCode: '04', Message: 'Invalid amount' })
  }

  // ─── 5. Update booking ────────────────────────────────────────────────────

  if (responseCode === '00') {
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status:         'confirmed',
        payment_ref:    query.vnp_TransactionNo ?? transactionRef,
        paid_at:        now,
        updated_at:     now,
      })
      .eq('id', transactionRef)

    if (updateErr) {
      console.error('[vnpay-ipn] Update error:', updateErr.message)
      return NextResponse.json({ RspCode: '99', Message: 'Unknown error' })
    }
  } else {
    await supabase
      .from('bookings')
      .update({
        payment_status: 'unpaid',
        status:         'cancelled',
        updated_at:     now,
      })
      .eq('id', transactionRef)
  }

  // ─── 6. Return VNPay required format ─────────────────────────────────────

  return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' })
}
