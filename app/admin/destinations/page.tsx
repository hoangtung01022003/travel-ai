import { createAdminClient } from '@/lib/supabase/admin'
import DestinationsClient from './destinations-client'

export default async function AdminDestinationsPage() {
  const supabase = createAdminClient()

  const { data: destinations, error } = await supabase
    .from('destinations')
    .select(
      'id, name, slug, province, region, destination_type, is_featured, avg_rating, review_count, min_price, suggested_days, cover_image, description, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải dữ liệu: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DestinationsClient destinations={destinations ?? []} />
    </div>
  )
}
