'use server'

import { AuthError } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/schema/auth'
import { createValidatedAction } from '@/lib/utils/create-validated-action'

const mapAuthError = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Incorrect email or password'
    case 'Email not confirmed':
      return 'Your email has not been confirmed. Please check your inbox'
    default:
      return error.message
  }
}

export const loginAction = createValidatedAction<typeof loginSchema, string>(
  loginSchema,
  async (validatedData) => {
    const supabase = await createClient()

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      throw new Error(mapAuthError(error))
    }

    if (!authData.user) {
      throw new Error('Đăng nhập thành công nhưng không tìm thấy thông tin người dùng.')
    }

    // Lấy role của người dùng
    // Fetch role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const role = profile?.role || 'user'

    // Sync role to user_metadata for middleware performance
    // This allows the middleware to read the role from the token without a DB query
    await supabase.auth.updateUser({
      data: { role }
    })

    return role
  }
)
