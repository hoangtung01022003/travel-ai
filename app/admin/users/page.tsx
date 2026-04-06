import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersClient from './users-client'
import type { Profile } from '@/types/profile'

export default async function AdminUsersPage() {
  const serverClient = await createClient()
  const { data: { user: currentAuthUser } } = await serverClient.auth.getUser()
  const currentUserId = currentAuthUser?.id ?? ''

  const supabase = createAdminClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải danh sách users: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <UsersClient users={(users as Profile[]) ?? []} currentUserId={currentUserId} />
    </div>
  )
}
