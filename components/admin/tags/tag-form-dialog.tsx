'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminCreateTag, adminUpdateTag } from '@/components/admin/actions/admin-crud-actions'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagFormDialogProps {
  mode: 'create' | 'edit'
  tag?: Tag
}

export function TagFormDialog({ mode, tag }: TagFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    if (open && tag) {
      setName(tag.name)
      setSlug(tag.slug)
    } else if (open && mode === 'create') {
      setName('')
      setSlug('')
    }
  }, [open, tag, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && tag) fd.append('id', tag.id)
    fd.append('name', name)
    fd.append('slug', slug)
    startTransition(async () => {
      const action = mode === 'create' ? adminCreateTag : adminUpdateTag
      const result = await action(fd)
      if (result.success) {
        toast.success(mode === 'create' ? 'Tạo tag thành công' : 'Cập nhật thành công')
        setOpen(false)
      } else { toast.error(result.error || 'Có lỗi xảy ra') }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Thêm tag</Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" /><span className="sr-only">Sửa</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Thêm tag mới' : 'Chỉnh sửa tag'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên tag <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="VD: Biển đẹp" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generate nếu để trống" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
