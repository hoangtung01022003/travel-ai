'use server'

import { createServerAction } from '@/lib/utils/server-actions'
import { createClient } from '@/lib/supabase/server'
import { Tour } from '@/types/tour'

export const getTours = createServerAction(
  async (params?: {
    search?: string
    minPrice?: number
    maxPrice?: number
    minDays?: number
    maxDays?: number
    destinationId?: string
    limit?: number
    offset?: number
  }) => {
    const supabase = await createClient()

    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
      )
    }
    if (params?.minPrice !== undefined && params.minPrice > 0) {
      query = query.gte('price', params.minPrice)
    }
    if (params?.maxPrice !== undefined && params.maxPrice > 0) {
      query = query.lte('price', params.maxPrice)
    }
    if (params?.minDays) {
      query = query.gte('duration_days', params.minDays)
    }
    if (params?.maxDays) {
      query = query.lte('duration_days', params.maxDays)
    }
    if (params?.destinationId) {
      query = query.eq('destination_id', params.destinationId)
    }
    if (params?.limit) {
      query = query.limit(params.limit)
    }
    if (params?.offset) {
      query = query.range(
        params.offset,
        params.offset + (params?.limit || 12) - 1
      )
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return { tours: data || [], count: count || 0 }
  }
)

export const getTourByslug = createServerAction(async (slug?: Tour['slug']) => {
  const supabase = await createClient()

  const { data: tour, error: destError } = await supabase
    .from('tours')
    .select(
      `*, tour_itineraries(id, day_number, title, description, sort_order)`
    )
    .eq('slug', slug)
    .single()

  if (destError) throw new Error(destError.message)
  if (!tour) return null

  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select(
      `id, 
       rating, 
       comment, 
       created_at,
       profiles:user_id(full_name, avatar_url)`
    )
    .eq('target_id', tour.id)
    .eq('target_type', 'tour')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (reviewError) throw new Error(reviewError.message)

  return {
    ...tour,
    reviews: reviews || [],
  }
})
