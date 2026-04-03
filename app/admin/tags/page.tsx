import { Tags } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagFormDialog } from '@/components/admin/tags/tag-form-dialog'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteTag } from '@/components/admin/actions/admin-crud-actions'

export default async function AdminTagsPage() {
  const supabase = createAdminClient()

  const { data: tags, error } = await supabase
    .from('tags')
    .select('id, name, slug, created_at')
    .order('name', { ascending: true })

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
          <h1 className="text-2xl font-bold">Quản lý Tags</h1>
          <p className="text-sm text-muted-foreground">{tags?.length ?? 0} tags</p>
        </div>
        <TagFormDialog mode="create" />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="h-4 w-4" /> Tất cả tags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(tags ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Chưa có tag nào</div>
          ) : (
            <div className="divide-y divide-border">
              {(tags ?? []).map((tag) => (
                <div key={tag.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                    🏷
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{tag.name}</p>
                    <code className="text-xs text-muted-foreground">#{tag.slug}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <TagFormDialog mode="edit" tag={tag} />
                    <AdminDeleteButton id={tag.id} entityName={tag.name} action={adminDeleteTag} />
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
