import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyToursClient from '@/components/my-tours/my-tours-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đặt chỗ của tôi — VietTravel',
  description: 'Quản lý các tour và khách sạn đã đặt',
}

export default async function MyToursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings } = await (supabase as any)
    .from('bookings')
    .select(`
      id, status, payment_status, num_people, travel_date,
      total_price, payment_method, note, created_at, booking_type,
      item_name, item_price_snapshot,
      tours (
        id, slug, cover_image, duration_days
      ),
      hotels (
        id, slug, cover_image, star_rating
      ),
      reviews (
        id, rating, comment, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MyToursClient bookings={bookings ?? []} />
}

