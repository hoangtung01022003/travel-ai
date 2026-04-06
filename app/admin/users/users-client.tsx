'use client'

import { useState, useMemo } from 'react'
import {
  Users, Search, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserRoleManager } from '@/components/admin/users/user-role-manager'
import type { Profile } from '@/types/profile'

interface UsersClientProps {
  users: Profile[]
  currentUserId: string
}

const PAGE_SIZE = 20

export default function UsersClient({ users, currentUserId }: UsersClientProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && u.status !== 'banned') ||
        (statusFilter === 'banned' && u.status === 'banned')
      
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const resetPage = () => setPage(1)

  const adminCount = users.filter((u) => u.role === 'admin').length
  const bannedCount = users.filter((u) => u.status === 'banned').length

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Users</h1>
          <p className="text-sm text-muted-foreground">Tổng {users.length} người dùng</p>
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

      {/* Filters */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['all', 'admin', 'user'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); resetPage() }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {r === 'all' ? 'Mọi Role' : r === 'admin' ? 'Admin' : 'User'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'banned'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); resetPage() }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {s === 'all' ? 'Mọi TT' : s === 'active' ? 'Active' : 'Banned'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-medium">Danh sách người dùng</p>
        </div>

        {pageData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border text-left text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tham gia</th>
                  <th className="px-4 py-3 text-right">Phân quyền / Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="truncate text-sm font-medium">{user.full_name || '(Chưa cập nhật)'}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === 'banned' ? 'destructive' : 'outline'}>
                        {user.status === 'banned' ? '🚫 Banned' : '✅ Active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <UserRoleManager user={user} currentUserId={currentUserId} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Trang {page}/{totalPages}</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <div key={p} className="flex items-center gap-1">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                  <Button size="sm" variant={p === page ? 'default' : 'outline'} className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 Không thể thay đổi quyền hoặc trạng thái của tài khoản đang đăng nhập.
      </p>
    </>
  )
}
