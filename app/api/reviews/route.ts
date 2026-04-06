import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/reviews
 *
 * Tạo review mới. Điều kiện:
 * 1. User phải đang login
 * 2. booking_id phải tồn tại, thuộc user, status = 'completed'
 * 3. Chưa có review nào cho booking này (unique constraint)
 */
export async function POST(request: Request) {
  try {
    // ─── 1. Auth ─────────────────────────────────────────────────────────────

    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để đánh giá' }, { status: 401 })
    }

    // ─── 2. Parse input ───────────────────────────────────────────────────────

    const body = await request.json()
    const { booking_id, target_type, target_id, rating, comment } = body as {
      booking_id:  string
      target_type: 'tour' | 'hotel'
      target_id:   string
      rating:      number
      comment?:    string
    }

    if (!booking_id || !target_type || !target_id || !rating) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating phải từ 1 đến 5' }, { status: 400 })
    }
    if (!['tour', 'hotel'].includes(target_type)) {
      return NextResponse.json({ error: 'target_type không hợp lệ' }, { status: 400 })
    }

    // ─── 3. Validate booking ──────────────────────────────────────────────────
    // Dùng admin client để đọc booking (bypass RLS để check đầy đủ)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, user_id, status, booking_type')
      .eq('id', booking_id)
      .maybeSingle()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking không tồn tại' }, { status: 404 })
    }

    // ownership check
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền đánh giá booking này' }, { status: 403 })
    }

    // status check — chỉ được review khi completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Chỉ có thể đánh giá sau khi hoàn thành chuyến đi' },
        { status: 422 }
      )
    }

    // booking_type phải match target_type
    if (booking.booking_type !== target_type) {
      return NextResponse.json({ error: 'Loại đánh giá không khớp với booking' }, { status: 422 })
    }

    // ─── 4. Kiểm tra duplicate ────────────────────────────────────────────────

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá booking này rồi' },
        { status: 409 }
      )
    }

    // ─── 5. Insert review ─────────────────────────────────────────────────────

    const { data: review, error: insertErr } = await supabase
      .from('reviews')
      .insert({
        user_id:     user.id,
        booking_id,
        target_type,
        target_id,
        rating,
        comment:     comment?.trim() || null,
        is_visible:  true,
      })
      .select('id, rating, comment, created_at')
      .single()

    if (insertErr) {
      // Unique constraint violation (double submit race condition)
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Bạn đã đánh giá booking này rồi' }, { status: 409 })
      }
      console.error('[POST /api/reviews]', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ review }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/reviews] unexpected', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
