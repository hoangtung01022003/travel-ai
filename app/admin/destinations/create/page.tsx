import { createAdminClient } from '@/lib/supabase/admin'
import DestinationCreateClient from './destination-create-client'

export default async function AdminDestinationCreatePage() {
  const supabase = createAdminClient()

  const [
    { data: tags },
    { data: existingAttractions },
  ] = await Promise.all([
    supabase.from('tags').select('id, name, slug').order('name', { ascending: true }),
    // Lấy attractions chưa gắn vào destination nào (hoặc tất cả để linh động chọn)
    supabase.from('attractions').select('id, name, description, image_url, entry_fee, destination_id').order('name', { ascending: true }),
  ])

  return (
    <div className="space-y-6 animate-fade-in mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Thêm Điểm đến mới</h1>
        <p className="text-sm text-muted-foreground">Điền thông tin, thêm điểm tham quan và gán tags.</p>
      </div>

      <DestinationCreateClient
        allTags={tags ?? []}
        existingAttractions={existingAttractions ?? []}
      />
    </div>
  )
}
