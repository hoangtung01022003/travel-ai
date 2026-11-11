'use server'

import { createServerAction } from '@/lib/utils/server-actions'
import { createClient } from '@/lib/supabase/server'
import { Destination, DestinationTagCustom } from '@/types/destination'

export const getDestinations = createServerAction(
  async (params?: {
    search?: string
    type?: string
    region?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    limit?: number
    offset?: number
    featured?: boolean
  }) => {
    const supabase = await createClient()

    let query = supabase
      .from('destinations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,province.ilike.%${params.search}%`
      )
    }
    if (params?.type) {
      query = query.eq('destination_type', params.type)
    }
    if (params?.region) {
      query = query.eq('region', params.region)
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

    return { destinations: data || [], count: count || 0 }
  }
)

export const getDestinationBySlug = createServerAction(
  async (slug?: Destination['slug']) => {
    if (!slug) return null
    const supabase = await createClient()

    const rawSlug = slug.trim()
    const decodedSlug = decodeURIComponent(rawSlug)
    const dashedSlug = decodedSlug.replace(/\s+/g, '-')
    const spacedSlug = decodedSlug.replace(/-/g, ' ')

    const { data: destination, error: destError } = await supabase
      .from('destinations')
      .select(
        `*, 
       destination_images(id, image_url, caption, sort_order),
       attractions(id, name, description, image_url, entry_fee, sort_order),
       destination_tags(tags(id, name, slug))`
      )
      .or(`slug.eq."${rawSlug}",slug.eq."${decodedSlug}",slug.eq."${dashedSlug}",slug.eq."${spacedSlug}"`)
      .maybeSingle()

    if (destError) throw new Error(destError.message)
    if (!destination) return null

    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select(
        `id, 
       rating, 
       comment, 
       created_at,
       profiles:user_id(full_name, avatar_url)`
      )
      .eq('target_id', destination.id)
      .eq('target_type', 'destination')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (reviewError) throw new Error(reviewError.message)

    return {
      ...destination,
      tags: (destination.destination_tags || [])
        .map((item: DestinationTagCustom) => item.tags)
        .flat(),
      reviews: reviews || [],
    }
  }
)
