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
  adminCreateHotel, adminUpdateHotel,
} from '@/components/admin/actions/admin-crud-actions'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import type { Database } from '@/types/database'

type Hotel = Database['public']['Tables']['hotels']['Row']
type Destination = Pick<Database['public']['Tables']['destinations']['Row'], 'id' | 'name'>

interface HotelFormDialogProps {
  mode: 'create' | 'edit'
  hotel?: Hotel
  destinations: Destination[]
}

export function HotelFormDialog({ mode, hotel, destinations }: HotelFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', slug: '', description: '', province: '',
    star_rating: '', min_price: '', is_featured: 'false',
    destination_id: '', cover_image: '', address: '',
  })

  useEffect(() => {
    if (open && hotel) {
      setForm({
        name: hotel.name ?? '', slug: hotel.slug ?? '',
        description: hotel.description ?? '', province: hotel.province ?? '',
        star_rating: hotel.star_rating?.toString() ?? '',
        min_price: hotel.min_price?.toString() ?? '',
        is_featured: hotel.is_featured ? 'true' : 'false',
        destination_id: hotel.destination_id ?? '',
        cover_image: hotel.cover_image ?? '',
        address: hotel.address ?? '',
      })
    } else if (open && mode === 'create') {
      setForm({ name: '', slug: '', description: '', province: '', star_rating: '', min_price: '', is_featured: 'false', destination_id: '', cover_image: '', address: '' })
    }
  }, [open, hotel, mode])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && hotel) fd.append('id', hotel.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const action = mode === 'create' ? adminCreateHotel : adminUpdateHotel
      const result = await action(fd)
      if (result.success) {
        toast.success(mode === 'create' ? 'Tạo khách sạn thành công' : 'Cập nhật thành công')
        setOpen(false)
      } else { toast.error(result.error || 'Có lỗi xảy ra') }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Thêm khách sạn</Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" /><span className="sr-only">Sửa</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Thêm khách sạn mới' : 'Chỉnh sửa khách sạn'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tên khách sạn <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="VD: Vinpearl Resort" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generate" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Tỉnh/TP</Label>
              <Input value={form.province} onChange={(e) => set('province', e.target.value)} placeholder="Đà Nẵng" />
            </div>
            <div className="space-y-1.5">
              <Label>Hạng sao</Label>
              <select value={form.star_rating} onChange={(e) => set('star_rating', e.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Chọn...</option>
                {[1,2,3,4,5].map((s) => <option key={s} value={s}>{s} sao</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Giá từ (VNĐ)</Label>
              <Input type="number" min="0" value={form.min_price} onChange={(e) => set('min_price', e.target.value)} placeholder="800000" />
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
              <Label>Nổi bật</Label>
              <select value={form.is_featured} onChange={(e) => set('is_featured', e.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="false">Không</option>
                <option value="true">Có</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Địa chỉ</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Số 1 đường..." />
          </div>
          <div className="space-y-1.5">
            <Label>Ảnh bìa</Label>
             <ImageUpload 
              value={form.cover_image} 
              onChange={(url) => set('cover_image', url)} 
              folder="hotels" 
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả khách sạn..." />
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
