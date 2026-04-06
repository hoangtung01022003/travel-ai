'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Cập nhật trạng thái booking ────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

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
