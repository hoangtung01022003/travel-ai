import { Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserRoleManager } from '@/components/admin/users/user-role-manager'
import type { Profile } from '@/types/profile'

export default async function AdminUsersPage() {
  // Lấy current user để bảo vệ "không đổi chính mình"
  const serverClient = await createClient()
  const { data: { user: currentAuthUser } } = await serverClient.auth.getUser()
  const currentUserId = currentAuthUser?.id ?? ''

  const supabase = createAdminClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải danh sách users: {error.message}
      </div>
    )
  }

  const adminCount = (users ?? []).filter((u) => u.role === 'admin').length
  const bannedCount = (users ?? []).filter((u) => u.status === 'banned').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Users</h1>
          <p className="text-sm text-muted-foreground">
            Tổng {users?.length ?? 0} người dùng
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-white px-4 py-2 text-center">
            <p className="text-xl font-bold text-primary">{adminCount}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-2 text-center">
            <p className="text-xl font-bold text-destructive">{bannedCount}</p>
            <p className="text-xs text-muted-foreground">Đã ban</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Danh sách người dùng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(users ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Chưa có người dùng nào
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(users as Profile[]).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.full_name || '(Chưa cập nhật)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  {/* Join date */}
                  <div className="hidden text-xs text-muted-foreground lg:block">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('vi-VN')
                      : '—'}
                  </div>

                  {/* Status badge */}
                  <Badge
                    variant={user.status === 'banned' ? 'destructive' : 'outline'}
                    className="hidden shrink-0 sm:inline-flex"
                  >
                    {user.status === 'banned' ? '🚫 Banned' : '✅ Active'}
                  </Badge>

                  {/* Role manager (client component) */}
                  <UserRoleManager user={user} currentUserId={currentUserId} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        💡 Không thể thay đổi quyền hoặc trạng thái của tài khoản đang đăng nhập.
      </p>
    </div>
  )
}
