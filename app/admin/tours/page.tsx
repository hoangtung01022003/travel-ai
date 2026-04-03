import { Route, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils/common'
import { TourFormDialog } from '@/components/admin/tours/tour-form-dialog'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteTour } from '@/components/admin/actions/admin-crud-actions'

export default async function AdminToursPage() {
  const supabase = createAdminClient()

  const [{ data: tours, error }, { data: destinations }] = await Promise.all([
    supabase
      .from('tours')
      .select(
        'id, name, slug, price, duration_days, is_active, avg_rating, review_count, cover_image, max_group_size, description, destination_id, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),
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

  const destList = destinations ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Tours</h1>
          <p className="text-sm text-muted-foreground">{tours?.length ?? 0} tours</p>
        </div>
        <TourFormDialog mode="create" destinations={destList} />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4 text-primary" /> Danh sách tours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(tours ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Chưa có tour nào</div>
          ) : (
            <div className="divide-y divide-border">
              {(tours ?? []).map((tour) => {
                const destName = destList.find((d) => d.id === tour.destination_id)?.name
                return (
                  <div
                    key={tour.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Route className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tour.name}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{tour.duration_days} ngày</span>
                        {tour.max_group_size && <span>Max {tour.max_group_size} người</span>}
                        {destName && <span>📍 {destName}</span>}
                      </div>
                    </div>

                    <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {Number(tour.avg_rating ?? 0).toFixed(1)}
                        <span>({tour.review_count ?? 0})</span>
                      </span>
                      <span className="font-semibold text-primary">{formatPrice(tour.price)}</span>
                    </div>

                    <Badge variant={tour.is_active ? 'default' : 'muted'}>
                      {tour.is_active ? 'Active' : 'Paused'}
                    </Badge>

                    <div className="flex shrink-0 items-center gap-1">
                      <TourFormDialog mode="edit" tour={tour as Parameters<typeof TourFormDialog>[0]['tour']} destinations={destList} />
                      <AdminDeleteButton id={tour.id} entityName={tour.name} action={adminDeleteTour} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
