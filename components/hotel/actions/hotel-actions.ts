'use server'

import { createServerAction } from '@/lib/utils/server-actions'
import { createClient } from '@/lib/supabase/server'
import { Hotel } from '@/types/hotel'
import type { Database } from '@/types/database'

type Amenity = Omit<
  Database['public']['Tables']['amenities']['Row'],
  'created_at' | 'category'
>

const isMissingSchemaTableError = (error?: { code?: string } | null) =>
  error?.code === 'PGRST205' || error?.code === 'PGRST200'

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

    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (hotelError) throw new Error(hotelError.message)
    if (!hotel) return null

    const [imagesResult, roomsResult, amenitiesResult, reviewsResult] =
      await Promise.all([
        supabase
          .from('hotel_images')
          .select('id, image_url, caption, sort_order')
          .eq('hotel_id', hotel.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('room_types')
          .select('*')
          .eq('hotel_id', hotel.id)
          .order('price_per_night', { ascending: true }),
        supabase
          .from('hotel_amenities')
          .select('amenities(id, name, icon)')
          .eq('hotel_id', hotel.id),
        supabase
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
          .order('created_at', { ascending: false }),
      ])

    if (imagesResult.error && !isMissingSchemaTableError(imagesResult.error)) {
      throw new Error(imagesResult.error.message)
    }
    if (roomsResult.error && !isMissingSchemaTableError(roomsResult.error)) {
      throw new Error(roomsResult.error.message)
    }
    if (
      amenitiesResult.error &&
      !isMissingSchemaTableError(amenitiesResult.error)
    ) {
      throw new Error(amenitiesResult.error.message)
    }
    if (reviewsResult.error) throw new Error(reviewsResult.error.message)

    return {
      ...hotel,
      hotel_images: imagesResult.error ? [] : imagesResult.data || [],
      room_types: roomsResult.error ? [] : roomsResult.data || [],
      amenities: (amenitiesResult.error ? [] : amenitiesResult.data || [])
        .flatMap((item) => item.amenities || [])
        .filter(Boolean) as Amenity[],
      reviews: reviewsResult.data || [],
    }
  }
)
