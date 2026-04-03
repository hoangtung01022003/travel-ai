import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ItinerariesClient from '@/components/itineraries/itineraries-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lịch trình của tôi — VietTravel',
  description: 'Xem lại các lịch trình du lịch đã tạo bằng AI',
}

export default async function ItinerariesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: itineraries, error } = await supabase
    .from('ai_itineraries')
    .select('id, title, destination_name, duration_days, budget, num_people, result, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('[ItinerariesPage]', error)

  return <ItinerariesClient itineraries={itineraries ?? []} />
}
