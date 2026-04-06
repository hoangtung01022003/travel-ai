import { createAdminClient } from '@/lib/supabase/admin'
import TourCreateClient from './tour-create-client'

export default async function AdminTourCreatePage() {
  const supabase = createAdminClient()

  const { data: destinations } = await supabase
    .from('destinations')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Thêm Tour mới</h1>
        <p className="text-sm text-muted-foreground">Tạo thông tin chung. Bạn có thể thêm lịch trình sau khi lưu.</p>
      </div>

      <TourCreateClient destinations={destinations ?? []} />
    </div>
  )
}
