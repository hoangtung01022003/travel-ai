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
import {
  adminCreateTour,
  adminUpdateTour,
} from '@/components/admin/actions/admin-crud-actions'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import type { Database } from '@/types/database'

type Tour = Database['public']['Tables']['tours']['Row']
type Destination = Pick<Database['public']['Tables']['destinations']['Row'], 'id' | 'name'>

interface TourFormDialogProps {
  mode: 'create' | 'edit'
  tour?: Tour
  destinations: Destination[]
}

export function TourFormDialog({ mode, tour, destinations }: TourFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', slug: '', description: '',
    price: '', duration_days: '', max_group_size: '',
    is_active: 'true', destination_id: '', cover_image: '',
  })

  useEffect(() => {
    if (open && tour) {
      setForm({
        name: tour.name ?? '', slug: tour.slug ?? '',
        description: tour.description ?? '',
        price: tour.price?.toString() ?? '',
        duration_days: tour.duration_days?.toString() ?? '',
        max_group_size: tour.max_group_size?.toString() ?? '',
        is_active: tour.is_active !== false ? 'true' : 'false',
        destination_id: tour.destination_id ?? '',
        cover_image: tour.cover_image ?? '',
      })
    } else if (open && mode === 'create') {
      setForm({ name: '', slug: '', description: '', price: '', duration_days: '', max_group_size: '', is_active: 'true', destination_id: '', cover_image: '' })
    }
  }, [open, tour, mode])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && tour) fd.append('id', tour.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const action = mode === 'create' ? adminCreateTour : adminUpdateTour
      const result = await action(fd)
      if (result.success) {
        toast.success(mode === 'create' ? 'Tạo tour thành công' : 'Cập nhật thành công')
        setOpen(false)
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Thêm tour</Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" /><span className="sr-only">Sửa</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Thêm tour mới' : 'Chỉnh sửa tour'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tên tour <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="VD: Tour Sa Pa 3N2Đ" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generate nếu để trống" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Giá (VNĐ) <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required placeholder="2500000" />
            </div>
            <div className="space-y-1.5">
              <Label>Số ngày <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)} required placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label>Nhóm tối đa</Label>
              <Input type="number" min="1" value={form.max_group_size} onChange={(e) => set('max_group_size', e.target.value)} placeholder="15" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Điểm đến</Label>
              <select value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Chọn điểm đến...</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <select value={form.is_active} onChange={(e) => set('is_active', e.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="true">Hoạt động</option>
                <option value="false">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh bìa</Label>
            <ImageUpload 
              value={form.cover_image} 
              onChange={(url) => set('cover_image', url)} 
              folder="tours" 
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả tour..." />
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
