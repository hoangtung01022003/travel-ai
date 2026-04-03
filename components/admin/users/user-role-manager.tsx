'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Shield, User, Ban, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  adminUpdateUserRole,
  adminUpdateUserStatus,
} from '@/components/admin/actions/admin-crud-actions'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserRoleManagerProps {
  user: Profile
  currentUserId: string
}

export function UserRoleManager({ user, currentUserId }: UserRoleManagerProps) {
  const [isPending, startTransition] = useTransition()
  const isSelf = user.id === currentUserId
  const isAdmin = user.role === 'admin'
  const isBanned = user.status === 'banned'

  const handleRoleChange = (newRole: 'user' | 'admin') => {
    startTransition(async () => {
      const result = await adminUpdateUserRole({
        targetUserId: user.id,
        currentUserId,
        newRole,
      })
      if (result.success) {
        toast.success(
          newRole === 'admin'
            ? `Đã cấp quyền Admin cho ${user.full_name || user.email}`
            : `Đã thu hồi quyền Admin của ${user.full_name || user.email}`
        )
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    })
  }

  const handleStatusChange = (newStatus: 'active' | 'banned') => {
    startTransition(async () => {
      const result = await adminUpdateUserStatus({
        targetUserId: user.id,
        currentUserId,
        newStatus,
      })
      if (result.success) {
        toast.success(
          newStatus === 'banned'
            ? `Đã ban ${user.full_name || user.email}`
            : `Đã unban ${user.full_name || user.email}`
        )
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    })
  }

  if (isSelf) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={isAdmin ? 'default' : 'muted'}>
          {isAdmin ? 'Admin' : 'User'}
        </Badge>
        <Badge variant="muted" className="text-xs">Tài khoản của bạn</Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Role badge + toggle */}
      <Badge variant={isAdmin ? 'default' : 'muted'}>
        {isAdmin ? '🛡 Admin' : '👤 User'}
      </Badge>

      {/* Role change */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="h-7 gap-1 px-2 text-xs"
            title={isAdmin ? 'Thu hồi quyền Admin' : 'Cấp quyền Admin'}
          >
            {isAdmin ? (
              <><User className="h-3 w-3" /> Hạ xuống User</>
            ) : (
              <><Shield className="h-3 w-3" /> Cấp Admin</>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin ? 'Thu hồi quyền Admin?' : 'Cấp quyền Admin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? `Tài khoản "${user.full_name || user.email}" sẽ bị hạ xuống quyền User thông thường.`
                : `Tài khoản "${user.full_name || user.email}" sẽ có toàn quyền Admin Dashboard.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={isAdmin ? 'destructive' : 'default'}
              onClick={() => handleRoleChange(isAdmin ? 'user' : 'admin')}
            >
              {isAdmin ? 'Hạ xuống User' : 'Cấp quyền Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status change */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className={`h-7 gap-1 px-2 text-xs ${isBanned ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}`}
            title={isBanned ? 'Unban user' : 'Ban user'}
          >
            {isBanned ? (
              <><CheckCircle className="h-3 w-3" /> Unban</>
            ) : (
              <><Ban className="h-3 w-3" /> Ban</>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBanned ? 'Unban tài khoản?' : 'Ban tài khoản?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned
                ? `Tài khoản "${user.full_name || user.email}" sẽ được khôi phục hoạt động.`
                : `Tài khoản "${user.full_name || user.email}" sẽ bị khóa và không thể đăng nhập.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={isBanned ? 'default' : 'destructive'}
              onClick={() => handleStatusChange(isBanned ? 'active' : 'banned')}
            >
              {isBanned ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
