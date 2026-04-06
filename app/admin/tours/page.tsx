import { createAdminClient } from '@/lib/supabase/admin'
import ToursClient from './tours-client'

export default async function AdminToursPage() {
  const supabase = createAdminClient()

  const [{ data: tours, error }, { data: destinations }] = await Promise.all([
    supabase
      .from('tours')
      .select(
        'id, name, slug, price, duration_days, is_active, avg_rating, review_count, cover_image, max_group_size, description, destination_id, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('destinations')
      .select('id, name')
      .order('name', { ascending: true }),
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
      <ToursClient tours={tours ?? []} destinations={destinations ?? []} />
    </div>
  )
}
