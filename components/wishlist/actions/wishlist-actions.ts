'use server'

import { createClient } from '@/lib/supabase/server'

export type WishlistTarget = 'destination' | 'hotel'

type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; reason: 'unauthenticated' | 'error'; message?: string }

/** Trạng thái đã lưu của user hiện tại (false nếu chưa đăng nhập hoặc lỗi). */
export async function getWishlistStatus(targetType: WishlistTarget, targetId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  if (error) return false
  return !!data
}

/** Lưu / bỏ lưu yêu thích. */
export async function toggleWishlist(targetType: WishlistTarget, targetId: string): Promise<ToggleResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthenticated' }

  const { data: existing, error: findError } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()
  if (findError) return { ok: false, reason: 'error', message: findError.message }

  if (existing) {
    const { error } = await supabase.from('wishlists').delete().eq('id', existing.id)
    if (error) return { ok: false, reason: 'error', message: error.message }
    return { ok: true, saved: false }
  }

  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: user.id, target_type: targetType, target_id: targetId })
  if (error) return { ok: false, reason: 'error', message: error.message }
  return { ok: true, saved: true }
}
