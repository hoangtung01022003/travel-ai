import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import HotelEditClient from './hotel-edit-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminHotelEditPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [
    { data: hotel, error },
    { data: destinations },
    { data: roomTypes },
    { data: hotelImages },
    { data: amenities },
    { data: hotelAmenities },
    { data: tags },
    { data: hotelTags },
  ] = await Promise.all([
    supabase.from('hotels').select('*').eq('id', id).single(),
    supabase.from('destinations').select('id, name').order('name', { ascending: true }),
    supabase.from('room_types').select('*').eq('hotel_id', id).order('price_per_night', { ascending: true }),
    supabase.from('hotel_images').select('*').eq('hotel_id', id).order('sort_order', { ascending: true }),
    supabase.from('amenities').select('*').order('category', { ascending: true }),
    supabase.from('hotel_amenities').select('amenity_id').eq('hotel_id', id),
    supabase.from('tags').select('id, name, slug').order('name', { ascending: true }),
    supabase.from('hotel_tags').select('tag_id').eq('hotel_id', id),
  ])

  if (error || !hotel) {
    notFound()
  }

  return (
    <div className="space-y-6 animate-fade-in mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa Khách sạn</h1>
        <p className="text-sm text-muted-foreground">{hotel.name}</p>
      </div>

      <HotelEditClient
        hotel={hotel}
        destinations={destinations ?? []}
        roomTypes={roomTypes ?? []}
        hotelImages={hotelImages ?? []}
        allAmenities={amenities ?? []}
        selectedAmenityIds={(hotelAmenities ?? []).map((a: any) => a.amenity_id)}
        allTags={tags ?? []}
        selectedTagIds={(hotelTags ?? []).map((t: any) => t.tag_id)}
      />
    </div>
  )
}
