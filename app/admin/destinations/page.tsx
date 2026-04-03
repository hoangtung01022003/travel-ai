import { MapPin, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DESTINATION_TYPES } from '@/lib/constants/common'
import { formatPrice } from '@/lib/utils/common'
import { DestinationFormDialog } from '@/components/admin/destinations/destination-form-dialog'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteDestination } from '@/components/admin/actions/admin-crud-actions'

export default async function AdminDestinationsPage() {
  const supabase = createAdminClient()

  const { data: destinations, error } = await supabase
    .from('destinations')
    .select(
      'id, name, slug, province, region, destination_type, is_featured, avg_rating, review_count, min_price, suggested_days, cover_image, description, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải dữ liệu: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Điểm đến</h1>
          <p className="text-sm text-muted-foreground">
            {destinations?.length ?? 0} điểm đến
          </p>
        </div>
        <DestinationFormDialog mode="create" />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-success" />
            Danh sách điểm đến
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(destinations ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Chưa có điểm đến nào
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(destinations ?? []).map((dest) => {
                const typeInfo = DESTINATION_TYPES.find(
                  (t) => t.value === dest.destination_type
                )
                return (
                  <div
                    key={dest.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    {/* Type icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                      {typeInfo?.icon ?? '📍'}
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{dest.name}</p>
                        {dest.is_featured && (
                          <Badge variant="default" className="shrink-0 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {dest.province || '—'}
                        </span>
                        {typeInfo && (
                          <span>{typeInfo.label}</span>
                        )}
                        {dest.suggested_days && (
                          <span>{dest.suggested_days} ngày</span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {Number(dest.avg_rating ?? 0).toFixed(1)}
                        <span className="text-muted-foreground">
                          ({dest.review_count ?? 0})
                        </span>
                      </span>
                      {dest.min_price && (
                        <span className="text-primary font-medium">
                          {formatPrice(dest.min_price)}
                        </span>
                      )}
                    </div>

                    {/* Slug */}
                    <div className="hidden lg:block">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {dest.slug}
                      </code>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <DestinationFormDialog mode="edit" destination={dest as Parameters<typeof DestinationFormDialog>[0]['destination']} />
                      <AdminDeleteButton
                        id={dest.id}
                        entityName={dest.name}
                        action={adminDeleteDestination}
                      />
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
