import { createAdminClient } from '@/lib/supabase/admin'
import HotelCreateClient from './hotel-create-client'

export default async function AdminHotelCreatePage() {
  const supabase = createAdminClient()

  const [
    { data: destinations },
    { data: amenities },
    { data: tags },
  ] = await Promise.all([
    supabase.from('destinations').select('id, name').order('name', { ascending: true }),
    supabase.from('amenities').select('*').order('category', { ascending: true }),
    supabase.from('tags').select('id, name, slug').order('name', { ascending: true }),
  ])

  return (
    <div className="space-y-6 animate-fade-in mx-auto">
      <div>
        <h1 className="font-display text-primary relative pb-2 text-3xl font-semibold after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-12 after:rounded-full after:bg-[#c9932b] after:content-['']">Thêm Khách sạn mới</h1>
        <p className="text-sm text-muted-foreground">Điền đầy đủ thông tin, loại phòng, tiện nghi và album ảnh.</p>
      </div>

      <HotelCreateClient
        destinations={destinations ?? []}
        allAmenities={amenities ?? []}
        allTags={tags ?? []}
      />
    </div>
  )
}
