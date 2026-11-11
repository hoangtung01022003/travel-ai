'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerAction } from '@/lib/utils/server-actions'
import { UserRole } from '@/types/auth'
import { Profile } from '@/types/user'

export const getCurrentUser = createServerAction(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})

export const getCurrentUserWithRole = createServerAction(
  async (): Promise<{
    email: string | undefined
    userId: string | undefined
    role: UserRole | null
  }> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { email: undefined, userId: undefined, role: null }
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = (data?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'user'

    return {
      email: user.email,
      userId: user.id,
      role,
    }
  }
)

export const getFullProfile = createServerAction(
  async (): Promise<Profile | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (data) return data

    // Fallback nếu profile chưa kịp tạo trong DB
    return {
      id: user.id,
      email: user.email ?? '',
      full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || '',
      role: (user.user_metadata?.role as UserRole) || 'user',
      phone: null,
      avatar_url: null,
      status: 'active',
      created_at: user.created_at,
      updated_at: user.created_at,
    } as unknown as Profile
  }
)
