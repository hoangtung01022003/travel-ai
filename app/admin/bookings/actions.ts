'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'completed'
type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

// ── Cập nhật trạng thái booking ────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Lấy trạng thái thanh toán hiện tại để validate
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('payment_status, status')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return { success: false, error: 'Không tìm thấy đơn đặt chỗ' }
    }

    const paymentStatus = booking.payment_status as PaymentStatus

    // ── Business rule: chỉ confirm khi đã thanh toán ──────────────────────────
    if (newStatus === 'confirmed' && paymentStatus !== 'paid') {
      return {
        success: false,
        error: 'Chỉ có thể xác nhận khi đơn đã thanh toán thành công. Trạng thái thanh toán hiện tại: ' +
          (paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Đã hoàn tiền'),
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/bookings')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('[updateBookingStatus]', err)
    return { success: false, error: 'Lỗi hệ thống' }
  }
}

// ── Mark booking là completed (shortcut) ──────────────────────────────────────

export async function markBookingCompleted(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  return updateBookingStatus(bookingId, 'completed')
}
