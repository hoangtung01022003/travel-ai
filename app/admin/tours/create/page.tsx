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
        <h1 className="font-display text-primary relative pb-2 text-3xl font-semibold after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-12 after:rounded-full after:bg-[#c9932b] after:content-['']">Thêm Tour mới</h1>
        <p className="text-sm text-muted-foreground">Tạo thông tin chung. Bạn có thể thêm lịch trình sau khi lưu.</p>
      </div>

      <TourCreateClient destinations={destinations ?? []} />
    </div>
  )
}
