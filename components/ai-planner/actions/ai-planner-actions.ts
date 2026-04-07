'use server'

import { createClient } from '@/lib/supabase/server'

const AI_PLAN_LIMIT = 10

export async function saveItinerary(data: {
  title: string
  destination_name: string
  duration_days: number
  budget: number | null
  num_people: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any
  prompt?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Kiểm tra đăng nhập
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Bạn cần đăng nhập để lưu lịch trình' }
    }

    // Kiểm tra giới hạn 10 kế hoạch
    const { count, error: countError } = await supabase
      .from('ai_itineraries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return { success: false, error: 'Không thể kiểm tra số lượng lịch trình' }
    }

    if ((count ?? 0) >= AI_PLAN_LIMIT) {
      return {
        success: false,
        error: `Bạn đã đạt giới hạn ${AI_PLAN_LIMIT} lịch trình AI. Hãy xóa bớt lịch trình cũ trong trang /itineraries để tiếp tục.`,
      }
    }

    // Lưu lịch trình
    const { error: insertError } = await supabase
      .from('ai_itineraries')
      .insert({
        user_id:          user.id,
        title:            data.title,
        destination_name: data.destination_name,
        duration_days:    data.duration_days,
        budget:           data.budget,
        num_people:       data.num_people,
        result:           data.result,
        prompt:           data.prompt ?? '',
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[saveItinerary]', err)
    return { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại.' }
  }
}
