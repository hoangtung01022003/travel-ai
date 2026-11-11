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

export type WishlistItem = {
  wishlistId: string
  targetType: WishlistTarget
  targetId: string
  savedAt: string | null
  name: string
  slug: string
  coverImage: string | null
  province: string | null
  minPrice: number | null
  rating: number | null
}

/** Danh sách yêu thích của user hiện tại kèm thông tin điểm đến / khách sạn. null nếu chưa đăng nhập. */
export async function getMyWishlist(): Promise<WishlistItem[] | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from('wishlists')
    .select('id, target_type, target_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []

  const destIds = rows.filter((r) => r.target_type === 'destination').map((r) => r.target_id)
  const hotelIds = rows.filter((r) => r.target_type === 'hotel').map((r) => r.target_id)

  const [destRes, hotelRes] = await Promise.all([
    destIds.length
      ? supabase.from('destinations').select('id, name, slug, cover_image, province, min_price, avg_rating').in('id', destIds)
      : null,
    hotelIds.length
      ? supabase.from('hotels').select('id, name, slug, cover_image, province, min_price, star_rating').in('id', hotelIds)
      : null,
  ])

  type Info = { name: string; slug: string; cover_image: string | null; province: string | null; min_price: number | null; rating: number | null }
  const byKey = new Map<string, Info>()
  for (const d of destRes?.data ?? []) byKey.set(`destination:${d.id}`, { ...d, rating: d.avg_rating })
  for (const h of hotelRes?.data ?? []) byKey.set(`hotel:${h.id}`, { ...h, rating: h.star_rating })

  return rows.flatMap((r) => {
    const t = byKey.get(`${r.target_type}:${r.target_id}`)
    if (!t) return [] // mục đã bị xoá khỏi hệ thống
    return [{
      wishlistId: r.id,
      targetType: r.target_type as WishlistTarget,
      targetId: r.target_id,
      savedAt: r.created_at,
      name: t.name,
      slug: t.slug,
      coverImage: t.cover_image,
      province: t.province,
      minPrice: t.min_price != null ? Number(t.min_price) : null,
      rating: t.rating != null ? Number(t.rating) : null,
    }]
  })
}
