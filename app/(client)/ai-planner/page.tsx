import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AiPlannerPageClient from '@/components/ai-planner/ai-planner-page-client'
import type { Metadata } from 'next'
import Loading from './loading'

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlanCount = 0
  if (user) {
    const { count } = await supabase
      .from('ai_itineraries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    currentPlanCount = count ?? 0
  }

  return (
    <AiPlannerPageClient
      destinations={destinations ?? []}
      isLoggedIn={!!user}
      currentPlanCount={currentPlanCount}
    />
  )
}

export default function AiPlannerPage() {
  return (
    // Dùng Loading component từ loading.tsx làm fallback để skeleton hiển thị đúng
    <Suspense fallback={<Loading />}>
      <AiPlannerContent />
    </Suspense>
  )
}
