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

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return {
        email: user.email,
        userId: user.id,
        role: null,
      }
    }

    return {
      email: user.email,
      userId: user.id,
      role: data.role,
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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) return null
    return data
  }
)
