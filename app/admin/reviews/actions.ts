'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Toggle review visibility (hiện / ẩn) ──────────────────────────────────────

export async function toggleReviewVisibility(
  reviewId: string,
  currentVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: !currentVisible, updated_at: new Date().toISOString() })
      .eq('id', reviewId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('[toggleReviewVisibility]', err)
    return { success: false, error: 'Lỗi hệ thống' }
  }
}

// ── Delete review (hard delete) ────────────────────────────────────────────────

export async function deleteReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('[deleteReview]', err)
    return { success: false, error: 'Lỗi hệ thống' }
  }
}

// ── Resolve report (dismiss hoặc hide review) ─────────────────────────────────

export async function resolveReport(
  reportId: string,
  action: 'dismiss' | 'hide_review',
  reviewId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Nếu action = hide_review → ẩn review trước
    if (action === 'hide_review' && reviewId) {
      await supabase
        .from('reviews')
        .update({ is_visible: false, updated_at: new Date().toISOString() })
        .eq('id', reviewId)
    }

    // Update report status
    const newStatus = action === 'dismiss' ? 'dismissed' : 'reviewed'
    const { error } = await supabase
      .from('review_reports')
      .update({ status: newStatus, resolved_at: new Date().toISOString() })
      .eq('id', reportId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/reviews')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('[resolveReport]', err)
    return { success: false, error: 'Lỗi hệ thống' }
  }
}
