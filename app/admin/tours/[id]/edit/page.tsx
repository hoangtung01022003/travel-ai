import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import TourEditClient from './tour-edit-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminTourEditPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [
    { data: tour, error },
    { data: destinations },
    { data: itineraries },
  ] = await Promise.all([
    supabase.from('tours').select('*').eq('id', id).single(),
    supabase.from('destinations').select('id, name').order('name', { ascending: true }),
    supabase.from('tour_itineraries').select('*').eq('tour_id', id).order('day_number', { ascending: true }),
  ])

  if (error || !tour) {
    notFound()
  }

  return (
    <div className="space-y-6 animate-fade-in mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa Tour</h1>
        <p className="text-sm text-muted-foreground">{tour.name}</p>
      </div>

      <TourEditClient
        tour={tour}
        destinations={destinations ?? []}
        itineraries={itineraries ?? []}
      />
    </div>
  )
}
