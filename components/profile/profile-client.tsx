'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Shield, Calendar,
  Edit3, Save, X, CheckCircle2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { updateProfile } from '@/components/features/profile/actions/profile-actions'
import { toast } from 'sonner'
import type { Profile } from '@/types/user'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileClientProps {
  profile: Profile | null
  userEmail: string
}

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

const ROLE_LABEL: Record<string, string> = {
  admin: '👑 Admin',
  user: '🙂 Thành viên',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileClient({ profile, userEmail }: ProfileClientProps) {
  // Local profile state — cập nhật ngay sau khi save thành công
  const [localProfile, setLocalProfile] = useState<Profile | null>(profile)

  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Edit form values
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone,    setPhone]    = useState(profile?.phone ?? '')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // ✅ CHIẾN THUẬT: Gọi Server Action thay vì gọi trực tiếp Browser Supabase
      // Điều này triệt tiêu hoàn toàn Race Condition và Xung đột session giữa Client/Server
      const result = await updateProfile({
        email: displayEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
      })

      if (!result.success) {
        setError(result.error || 'Cập nhật thất bại')
        return
      }

      // ✅ Cập nhật local state ngay lập tức — mượt mà không cần reload trang
      const updatedData = result.data as Profile
      setLocalProfile(updatedData)
      
      setEditing(false)
      toast.success('Cập nhật thông tin thành công!')
    } catch (err: any) {
      console.error('Update profile error:', err)
      setError(err.message || 'Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset về giá trị hiện tại của localProfile
    setFullName(localProfile?.full_name ?? '')
    setPhone(localProfile?.phone ?? '')
    setEditing(false)
    setError('')
  }

  const displayEmail = localProfile?.email || userEmail
  // Avatar initial được derive từ localProfile — cập nhật ngay khi save
  const initial = (localProfile?.full_name || displayEmail || 'U').charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Avatar card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 text-2xl border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">
                {localProfile?.full_name || 'Người dùng'}
              </h1>
              <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                  {ROLE_LABEL[localProfile?.role ?? 'user'] ?? localProfile?.role}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-700">
                  {localProfile?.status === 'active' ? '✓ Hoạt động' : localProfile?.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Thông tin cá nhân</h2>
            {!editing ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" /> Hủy
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lưu...</>
                    : <><Save className="h-3.5 w-3.5" /> Lưu</>
                  }
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Họ và tên
              </Label>
              {editing ? (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              ) : (
                <p className="text-sm font-medium pl-1">
                  {localProfile?.full_name || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                </p>
              )}
            </div>

            {/* Email — read only */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <p className="text-sm font-medium pl-1 text-muted-foreground">{displayEmail}</p>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Số điện thoại
              </Label>
              {editing ? (
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                />
              ) : (
                <p className="text-sm font-medium pl-1">
                  {localProfile?.phone || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> Vai trò
              </Label>
              <p className="text-sm font-medium pl-1">
                {ROLE_LABEL[localProfile?.role ?? 'user'] ?? localProfile?.role}
              </p>
            </div>

            {/* Joined */}
            {localProfile?.created_at && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Ngày tham gia
                </Label>
                <p className="text-sm font-medium pl-1">{fmtDate(localProfile.created_at)}</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <X className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Success hint when not editing */}
          {!editing && !error && localProfile?.full_name && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden>
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Thông tin đã được cập nhật
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-lg">Tác vụ nhanh</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { href: '/my-tours', label: '📋 Xem đặt chỗ của tôi', desc: 'Tour và khách sạn đã đặt' },
              { href: '/itineraries', label: '✨ Lịch trình AI', desc: 'Các lịch trình đã tạo' },
              { href: '/ai-planner', label: '🗺️ Tạo lịch trình mới', desc: 'Để AI lập kế hoạch cho bạn' },
              { href: '/tours', label: '🌏 Khám phá tour', desc: 'Tìm tour phù hợp' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group flex flex-col rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <span className="font-medium text-sm group-hover:text-primary transition-colors">{item.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{item.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
