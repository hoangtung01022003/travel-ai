import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/profile/profile-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hồ sơ của tôi — VietTravel',
  description: 'Quản lý thông tin cá nhân và tài khoản',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, phone, email, avatar_url, role, status, created_at')
    .eq('id', user.id)
    .single()

  return <ProfileClient profile={profile} userEmail={user.email ?? ''} />
}
