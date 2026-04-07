import { Database } from '@/types/database'
import { Review } from '@/types/destination'

export type Tour = Database['public']['Tables']['tours']['Row']

export type TourDetail = Tour & {
  tour_itineraries: Pick<
    Database['public']['Tables']['tour_itineraries']['Row'],
    'id' | 'day_number' | 'title' | 'description' | 'sort_order'
  >[]
  reviews: Review[]
  /** Departure dates (DATE[]) added via migration — not yet in generated DB types */
  start_dates?: string[] | null
}
