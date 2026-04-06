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
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import {
  adminCreateAttraction, adminUpdateAttraction,
} from '@/components/admin/actions/admin-crud-actions'
import type { Database } from '@/types/database'

type Attraction = Database['public']['Tables']['attractions']['Row']
type Destination = Pick<Database['public']['Tables']['destinations']['Row'], 'id' | 'name'>

interface AttractionFormDialogProps {
  mode: 'create' | 'edit'
  attraction?: Attraction
  destinations: Destination[]
}

export function AttractionFormDialog({ mode, attraction, destinations }: AttractionFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', description: '', image_url: '',
    entry_fee: '', sort_order: '', destination_id: '',
  })

  useEffect(() => {
    if (open && attraction) {
      setForm({
        name: attraction.name ?? '', description: attraction.description ?? '',
        image_url: attraction.image_url ?? '',
        entry_fee: attraction.entry_fee?.toString() ?? '',
        sort_order: attraction.sort_order?.toString() ?? '',
        destination_id: attraction.destination_id ?? '',
      })
    } else if (open && mode === 'create') {
      setForm({ name: '', description: '', image_url: '', entry_fee: '', sort_order: '', destination_id: '' })
    }
  }, [open, attraction, mode])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && attraction) fd.append('id', attraction.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const action = mode === 'create' ? adminCreateAttraction : adminUpdateAttraction
      const result = await action(fd)
      if (result.success) {
        toast.success(mode === 'create' ? 'Tạo điểm tham quan thành công' : 'Cập nhật thành công')
        setOpen(false)
      } else { toast.error(result.error || 'Có lỗi xảy ra') }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Thêm điểm tham quan</Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" /><span className="sr-only">Sửa</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Thêm điểm tham quan' : 'Chỉnh sửa điểm tham quan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="VD: Chùa Hương" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Điểm đến <span className="text-destructive">*</span></Label>
              <select value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)} required className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Chọn điểm đến...</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Phí vào cửa (VNĐ)</Label>
              <Input type="number" min="0" value={form.entry_fee} onChange={(e) => set('entry_fee', e.target.value)} placeholder="0 = Miễn phí" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh đại diện</Label>
            <ImageUpload value={form.image_url} onChange={(url) => set('image_url', url)} folder="attractions" />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
