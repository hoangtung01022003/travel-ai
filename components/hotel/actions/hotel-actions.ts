'use server'

import { createServerAction } from '@/lib/utils/server-actions'
import { createClient } from '@/lib/supabase/server'
import { Hotel, HotelAmenity } from '@/types/hotel'

export const getHotels = createServerAction(
  async (params?: {
    search?: string
    starRating?: number
    province?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    limit?: number
    offset?: number
    featured?: boolean
  }) => {
    const supabase = await createClient()

    let query = supabase
      .from('hotels')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,province.ilike.%${params.search}%`
      )
    }
    if (params?.starRating) {
      query = query.eq('star_rating', params.starRating)
    }
    if (params?.province) {
      query = query.ilike('province', `%${params.province}%`)
    }
    if (params?.minPrice !== undefined && params.minPrice > 0) {
      query = query.gte('min_price', params.minPrice)
    }
    if (params?.maxPrice !== undefined && params.maxPrice > 0) {
      query = query.lte('min_price', params.maxPrice)
    }
    if (params?.minRating !== undefined && params.minRating > 0) {
      query = query.gte('avg_rating', params.minRating)
    }
    if (params?.featured) {
      query = query.eq('is_featured', true)
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

    return { hotels: data || [], count: count || 0 }
  }
)

export const getHotelBySlug = createServerAction(
  async (slug?: Hotel['slug']) => {
    const supabase = await createClient()

    const { data: hotel, error: destError } = await supabase
      .from('hotels')
      .select(
        `*, 
       hotel_images(id, image_url, caption, sort_order),
       room_types(*),
       hotel_amenities(amenities(id, name, icon))`
      )
      .eq('slug', slug)
      .single()

    if (destError) throw new Error(destError.message)
    if (!hotel) return null

    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select(
        `id, 
       rating, 
       comment, 
       created_at,
       profiles:user_id(full_name, avatar_url)`
      )
      .eq('target_id', hotel.id)
      .eq('target_type', 'hotel')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (reviewError) throw new Error(reviewError.message)

    return {
      ...hotel,
      amenities: (hotel.hotel_amenities || [])
        .map((item: { amenities: HotelAmenity }) => item.amenities)
        .flat(),
      reviews: reviews || [],
    }
  }
)
