'use server'

import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/schema/auth'
import { createValidatedAction } from '@/lib/utils/create-validated-action'

export const registerAction = createValidatedAction<
  typeof registerSchema,
  void
>(registerSchema, async (validatedData) => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      data: {
        full_name: validatedData.full_name,
        role: 'user',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }
})
