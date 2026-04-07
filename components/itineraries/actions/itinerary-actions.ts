'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteItinerary(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này' }
    }

    // RLS sẽ tự bảo vệ — chỉ xóa được lịch trình của chính mình
    const { error } = await supabase
      .from('ai_itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/itineraries')
    return { success: true }
  } catch (err) {
    console.error('[deleteItinerary]', err)
    return { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại.' }
  }
}
