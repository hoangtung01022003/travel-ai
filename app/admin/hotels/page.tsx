import { Hotel, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils/common'
import { HotelFormDialog } from '@/components/admin/hotels/hotel-form-dialog'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteHotel } from '@/components/admin/actions/admin-crud-actions'

export default async function AdminHotelsPage() {
  const supabase = createAdminClient()

  const [{ data: hotels, error }, { data: destinations }] = await Promise.all([
    supabase
      .from('hotels')
      .select(
        'id, name, slug, province, star_rating, min_price, avg_rating, review_count, is_featured, cover_image, description, destination_id, address, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('destinations').select('id, name').order('name', { ascending: true }),
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
          <h1 className="text-2xl font-bold">Quản lý Khách sạn</h1>
          <p className="text-sm text-muted-foreground">{hotels?.length ?? 0} khách sạn</p>
        </div>
        <HotelFormDialog mode="create" destinations={destList} />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Hotel className="h-4 w-4" /> Danh sách khách sạn
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(hotels ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Chưa có khách sạn nào</div>
          ) : (
            <div className="divide-y divide-border">
              {(hotels ?? []).map((hotel) => (
                <div key={hotel.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-base">
                    🏨
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{hotel.name}</p>
                      {hotel.is_featured && <Badge variant="default" className="shrink-0 text-xs">Featured</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{hotel.province || '—'}</span>
                      {hotel.star_rating && <span>{'⭐'.repeat(hotel.star_rating)}</span>}
                    </div>
                  </div>

                  <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {Number(hotel.avg_rating ?? 0).toFixed(1)}
                      <span>({hotel.review_count ?? 0})</span>
                    </span>
                    {hotel.min_price && (
                      <span className="font-semibold text-primary">Từ {formatPrice(hotel.min_price)}</span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <HotelFormDialog mode="edit" hotel={hotel as Parameters<typeof HotelFormDialog>[0]['hotel']} destinations={destList} />
                    <AdminDeleteButton id={hotel.id} entityName={hotel.name} action={adminDeleteHotel} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
