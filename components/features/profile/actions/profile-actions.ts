'use server'

import { z } from 'zod'
import { createServerAction } from '@/lib/utils/server-actions'
import { createClient } from '@/lib/supabase/server'
import { createValidatedAction } from '@/lib/utils/create-validated-action'
import { profileSchema } from '@/lib/schema/profile'

import { revalidatePath } from 'next/cache'

export const getMyProfile = createServerAction(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
})

export async function updateProfile(validatedData: z.infer<typeof profileSchema>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }
    
    // Refresh toàn bộ các route liên quan đến Profile
    revalidatePath('/profile')
    revalidatePath('/', 'layout') 
    
    return { success: true, data }
  } catch (err: any) {
    console.error('[updateProfile Action Error]:', err)
    return { success: false, error: err.message || 'Lỗi hệ thống' }
  }
}

export const getMyItineraries = createServerAction(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('ai_itineraries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data || []
})

