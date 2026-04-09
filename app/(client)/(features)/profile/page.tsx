import { redirect } from 'next/navigation'
import { getFullProfile } from '@/components/layout/actions/user-info-action'
import ProfileClient from '@/components/profile/profile-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hồ sơ của tôi — VietTravel',
  description: 'Quản lý thông tin cá nhân và tài khoản',
}

export default async function ProfilePage() {
  const result = await getFullProfile()
  const profile = result.success ? result.data : null

  if (!profile) {
    redirect('/login')
  }

  return <ProfileClient profile={profile} userEmail={profile.email ?? ''} />
}
