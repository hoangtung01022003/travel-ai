'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerAction } from '@/lib/utils/server-actions'

// ── Map DB errors → user-friendly Vietnamese messages ───────────────────────────
function mapDeleteError(msg: string, entity: string): string {
  if (msg.includes('violates foreign key constraint') || msg.includes('still referenced')) {
    const hints: Record<string, string> = {
      tour:        'Tour này đang có booking liên kết. Hãy hủy hoặc xóa tất cả booking trước khi xóa tour.',
      hotel:       'Khách sạn này đang có booking liên kết. Hãy hủy hoặc xóa tất cả booking trước khi xóa khách sạn.',
      destination: 'Điểm đến này có tours/khách sạn liên kết. Hãy xóa chúng trước.',
      attraction:  'Không thể xóa điểm tham quan này vì đang được tham chiếu.',
      tag:         'Không thể xóa thẻ này vì đang được gán cho tour/khách sạn.',
    }
    return hints[entity] ?? `Không thể xóa do có dữ liệu phụ thuộc. Hãy xóa dữ liệu liên quan trước.`
  }
  if (msg.includes('duplicate') || msg.includes('unique')) return 'Dữ liệu bị trùng. Vui lòng kiểm tra lại.'
  return `Lỗi: ${msg}`
}

// ── Destinations ──────────────────────────────────────────────────────────────

export const adminCreateDestination = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const name = formData.get('name') as string
    const slug =
      (formData.get('slug') as string) ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

    const { error } = await supabase.from('destinations').insert({
      name,
      slug,
      description: (formData.get('description') as string) || null,
      destination_type: ((formData.get('destination_type') as string) || null) as 'beach' | 'mountain' | 'culture' | 'city' | 'countryside' | 'island' | null,
      province: (formData.get('province') as string) || null,
      region: (formData.get('region') as string) || null,
      cover_image: (formData.get('cover_image') as string) || null,
      is_featured: formData.get('is_featured') === 'true',
      suggested_days: formData.get('suggested_days')
        ? Number(formData.get('suggested_days'))
        : null,
      min_price: formData.get('min_price')
        ? Number(formData.get('min_price'))
        : null,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/destinations')
    return { success: true }
  }
)

export const adminUpdateDestination = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const slug =
      (formData.get('slug') as string) ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

    const { error } = await supabase
      .from('destinations')
      .update({
        name,
        slug,
        description: (formData.get('description') as string) || null,
        destination_type: ((formData.get('destination_type') as string) || null) as 'beach' | 'mountain' | 'culture' | 'city' | 'countryside' | 'island' | null,
        province: (formData.get('province') as string) || null,
        region: (formData.get('region') as string) || null,
        cover_image: (formData.get('cover_image') as string) || null,
        is_featured: formData.get('is_featured') === 'true',
        suggested_days: formData.get('suggested_days')
          ? Number(formData.get('suggested_days'))
          : null,
        min_price: formData.get('min_price')
          ? Number(formData.get('min_price'))
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/destinations')
    return { success: true }
  }
)

export const adminDeleteDestination = createServerAction(async (id: string) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('destinations').delete().eq('id', id)
  if (error) throw new Error(mapDeleteError(error.message, 'destination'))
  revalidatePath('/admin/destinations')
  return { success: true }
})

// ── Tours ─────────────────────────────────────────────────────────────────────

export const adminCreateTour = createServerAction(async (formData: FormData) => {
  const supabase = createAdminClient()
  const name = formData.get('name') as string
  const slug =
    (formData.get('slug') as string) ||
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const { error } = await supabase.from('tours').insert({
    name,
    slug,
    description: (formData.get('description') as string) || null,
    price: Number(formData.get('price')),
    duration_days: Number(formData.get('duration_days')),
    max_group_size: formData.get('max_group_size')
      ? Number(formData.get('max_group_size'))
      : null,
    is_active: formData.get('is_active') === 'true',
    destination_id: (formData.get('destination_id') as string) || null,
    cover_image: (formData.get('cover_image') as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tours')
  return { success: true }
})

export const adminUpdateTour = createServerAction(async (formData: FormData) => {
  const supabase = createAdminClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug =
    (formData.get('slug') as string) ||
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const { error } = await supabase
    .from('tours')
    .update({
      name,
      slug,
      description: (formData.get('description') as string) || null,
      price: Number(formData.get('price')),
      duration_days: Number(formData.get('duration_days')),
      max_group_size: formData.get('max_group_size')
        ? Number(formData.get('max_group_size'))
        : null,
      is_active: formData.get('is_active') === 'true',
      destination_id: (formData.get('destination_id') as string) || null,
      cover_image: (formData.get('cover_image') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tours')
  return { success: true }
})

export const adminDeleteTour = createServerAction(async (id: string) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tours').delete().eq('id', id)
  if (error) throw new Error(mapDeleteError(error.message, 'tour'))
  revalidatePath('/admin/tours')
  return { success: true }
})

// ── Hotels ────────────────────────────────────────────────────────────────────

export const adminCreateHotel = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const name = formData.get('name') as string
    const slug =
      (formData.get('slug') as string) ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

    const { error } = await supabase.from('hotels').insert({
      name,
      slug,
      description: (formData.get('description') as string) || null,
      province: (formData.get('province') as string) || null,
      star_rating: formData.get('star_rating')
        ? Number(formData.get('star_rating'))
        : null,
      min_price: formData.get('min_price')
        ? Number(formData.get('min_price'))
        : null,
      is_featured: formData.get('is_featured') === 'true',
      destination_id: (formData.get('destination_id') as string) || null,
      cover_image: (formData.get('cover_image') as string) || null,
      address: (formData.get('address') as string) || null,
      latitude: formData.get('latitude')
        ? Number(formData.get('latitude'))
        : null,
      longitude: formData.get('longitude')
        ? Number(formData.get('longitude'))
        : null,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/hotels')
    return { success: true }
  }
)

export const adminUpdateHotel = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const slug =
      (formData.get('slug') as string) ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

    const { error } = await supabase
      .from('hotels')
      .update({
        name,
        slug,
        description: (formData.get('description') as string) || null,
        province: (formData.get('province') as string) || null,
        star_rating: formData.get('star_rating')
          ? Number(formData.get('star_rating'))
          : null,
        min_price: formData.get('min_price')
          ? Number(formData.get('min_price'))
          : null,
        is_featured: formData.get('is_featured') === 'true',
        destination_id: (formData.get('destination_id') as string) || null,
        cover_image: (formData.get('cover_image') as string) || null,
        address: (formData.get('address') as string) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/hotels')
    return { success: true }
  }
)

export const adminDeleteHotel = createServerAction(async (id: string) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hotels').delete().eq('id', id)
  if (error) throw new Error(mapDeleteError(error.message, 'hotel'))
  revalidatePath('/admin/hotels')
  return { success: true }
})

// ── Attractions ───────────────────────────────────────────────────────────────

export const adminCreateAttraction = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('attractions').insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      image_url: (formData.get('image_url') as string) || null,
      entry_fee: formData.get('entry_fee')
        ? Number(formData.get('entry_fee'))
        : null,
      sort_order: formData.get('sort_order')
        ? Number(formData.get('sort_order'))
        : null,
      destination_id: formData.get('destination_id') as string,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/attractions')
    return { success: true }
  }
)

export const adminUpdateAttraction = createServerAction(
  async (formData: FormData) => {
    const supabase = createAdminClient()
    const id = formData.get('id') as string
    const { error } = await supabase
      .from('attractions')
      .update({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
        image_url: (formData.get('image_url') as string) || null,
        entry_fee: formData.get('entry_fee')
          ? Number(formData.get('entry_fee'))
          : null,
        sort_order: formData.get('sort_order')
          ? Number(formData.get('sort_order'))
          : null,
        destination_id: formData.get('destination_id') as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/attractions')
    return { success: true }
  }
)

export const adminDeleteAttraction = createServerAction(async (id: string) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('attractions').delete().eq('id', id)
  if (error) throw new Error(mapDeleteError(error.message, 'attraction'))
  revalidatePath('/admin/attractions')
  return { success: true }
})

// ── Tags ──────────────────────────────────────────────────────────────────────

export const adminCreateTag = createServerAction(async (formData: FormData) => {
  const supabase = createAdminClient()
  const name = formData.get('name') as string
  const slug =
    (formData.get('slug') as string) ||
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const { error } = await supabase.from('tags').insert({ name, slug })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tags')
  return { success: true }
})

export const adminUpdateTag = createServerAction(async (formData: FormData) => {
  const supabase = createAdminClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug =
    (formData.get('slug') as string) ||
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const { error } = await supabase
    .from('tags')
    .update({ name, slug })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tags')
  return { success: true }
})

export const adminDeleteTag = createServerAction(async (id: string) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw new Error(mapDeleteError(error.message, 'tag'))
  revalidatePath('/admin/tags')
  return { success: true }
})

// ── Users ─────────────────────────────────────────────────────────────────────

export const adminUpdateUserRole = createServerAction(
  async (params: {
    targetUserId: string
    currentUserId: string
    newRole: 'user' | 'admin'
  }) => {
    if (params.targetUserId === params.currentUserId) {
      throw new Error('Không thể thay đổi quyền của chính mình')
    }
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role: params.newRole })
      .eq('id', params.targetUserId)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/users')
    return { success: true }
  }
)

export const adminUpdateUserStatus = createServerAction(
  async (params: {
    targetUserId: string
    currentUserId: string
    newStatus: 'active' | 'banned'
  }) => {
    if (params.targetUserId === params.currentUserId) {
      throw new Error('Không thể thay đổi trạng thái của chính mình')
    }
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ status: params.newStatus })
      .eq('id', params.targetUserId)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/users')
    return { success: true }
  }
)
