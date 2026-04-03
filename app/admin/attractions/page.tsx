import { Landmark } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils/common'
import { AttractionFormDialog } from '@/components/admin/attractions/attraction-form-dialog'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteAttraction } from '@/components/admin/actions/admin-crud-actions'

export default async function AdminAttractionsPage() {
  const supabase = createAdminClient()

  const [{ data: attractions, error }, { data: destinations }] = await Promise.all([
    supabase
      .from('attractions')
      .select('id, name, description, entry_fee, sort_order, image_url, destination_id, created_at, updated_at')
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
          <h1 className="text-2xl font-bold">Quản lý Điểm tham quan</h1>
          <p className="text-sm text-muted-foreground">{attractions?.length ?? 0} điểm tham quan</p>
        </div>
        <AttractionFormDialog mode="create" destinations={destList} />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4" /> Danh sách điểm tham quan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(attractions ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Chưa có điểm tham quan nào</div>
          ) : (
            <div className="divide-y divide-border">
              {(attractions ?? []).map((attraction) => {
                const destName = destList.find((d) => d.id === attraction.destination_id)?.name
                return (
                  <div key={attraction.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{attraction.name}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        {destName && <span>📍 {destName}</span>}
                        <span>
                          {Number(attraction.entry_fee ?? 0) > 0
                            ? formatPrice(Number(attraction.entry_fee))
                            : 'Miễn phí'}
                        </span>
                        {attraction.description && (
                          <span className="hidden truncate max-w-xs lg:block">
                            {attraction.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <AttractionFormDialog
                        mode="edit"
                        attraction={attraction as Parameters<typeof AttractionFormDialog>[0]['attraction']}
                        destinations={destList}
                      />
                      <AdminDeleteButton id={attraction.id} entityName={attraction.name} action={adminDeleteAttraction} />
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
