import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AiPlannerPageClient from '@/components/ai-planner/ai-planner-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Lịch Trình — VietTravel',
  description:
    'Tạo lịch trình du lịch Việt Nam tự động với AI. Nhập điểm đến, số ngày và sở thích — AI sẽ lên kế hoạch chi tiết cho bạn.',
}

async function AiPlannerContent() {
  const supabase = await createClient()

  const { data: destinations } = await supabase
    .from('destinations')
    .select('id, name, slug, province, destination_type')
    .order('name')

  return <AiPlannerPageClient destinations={destinations ?? []} />
}

export default function AiPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <AiPlannerContent />
    </Suspense>
  )
}
