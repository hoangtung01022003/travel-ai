import { createAdminClient } from '@/lib/supabase/admin'
import HotelsClient from './hotels-client'

export default async function AdminHotelsPage() {
  const supabase = createAdminClient()

  const [{ data: hotels, error }, { data: destinations }] = await Promise.all([
    supabase
      .from('hotels')
      .select(
        'id, name, slug, province, star_rating, min_price, avg_rating, review_count, is_featured, cover_image, description, destination_id, address, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('destinations').select('id, name').order('name', { ascending: true }),
  ])

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải dữ liệu: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <HotelsClient hotels={hotels ?? []} destinations={destinations ?? []} />
    </div>
  )
}
