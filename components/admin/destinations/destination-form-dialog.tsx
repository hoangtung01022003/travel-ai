'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  adminCreateDestination,
  adminUpdateDestination,
} from '@/components/admin/actions/admin-crud-actions'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import type { Database } from '@/types/database'

type Destination = Database['public']['Tables']['destinations']['Row']
type DestinationType = Database['public']['Enums']['destination_type']

const DESTINATION_TYPES: { value: DestinationType; label: string }[] = [
  { value: 'beach', label: 'Biển' },
  { value: 'mountain', label: 'Núi' },
  { value: 'culture', label: 'Văn hóa' },
  { value: 'city', label: 'Thành phố' },
  { value: 'countryside', label: 'Làng quê' },
  { value: 'island', label: 'Đảo' },
]

const REGIONS = [
  { value: 'north', label: 'Miền Bắc' },
  { value: 'central', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
]

interface DestinationFormDialogProps {
  mode: 'create' | 'edit'
  destination?: Destination
}

export function DestinationFormDialog({
  mode,
  destination,
}: DestinationFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    destination_type: '' as DestinationType | '',
    province: '',
    region: '',
    cover_image: '',
    is_featured: 'false',
    suggested_days: '',
    min_price: '',
  })

  useEffect(() => {
    if (open && destination) {
      setForm({
        name: destination.name ?? '',
        slug: destination.slug ?? '',
        description: destination.description ?? '',
        destination_type: destination.destination_type ?? '',
        province: destination.province ?? '',
        region: destination.region ?? '',
        cover_image: destination.cover_image ?? '',
        is_featured: destination.is_featured ? 'true' : 'false',
        suggested_days: destination.suggested_days?.toString() ?? '',
        min_price: destination.min_price?.toString() ?? '',
      })
    } else if (open && mode === 'create') {
      setForm({
        name: '', slug: '', description: '', destination_type: '',
        province: '', region: '', cover_image: '',
        is_featured: 'false', suggested_days: '', min_price: '',
      })
    }
  }, [open, destination, mode])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && destination) fd.append('id', destination.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    startTransition(async () => {
      const action = mode === 'create' ? adminCreateDestination : adminUpdateDestination
      const result = await action(fd)
      if (result.success) {
        toast.success(mode === 'create' ? 'Tạo điểm đến thành công' : 'Cập nhật thành công')
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
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Thêm điểm đến
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Sửa</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm điểm đến mới' : 'Chỉnh sửa điểm đến'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dest-name">Tên <span className="text-destructive">*</span></Label>
              <Input id="dest-name" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="VD: Vịnh Hạ Long" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-slug">Slug</Label>
              <Input id="dest-slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generate nếu để trống" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Loại hình <span className="text-destructive">*</span></Label>
              <select
                value={form.destination_type}
                onChange={(e) => set('destination_type', e.target.value)}
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Chọn loại...</option>
                {DESTINATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-province">Tỉnh/TP</Label>
              <Input id="dest-province" value={form.province} onChange={(e) => set('province', e.target.value)} placeholder="VD: Quảng Ninh" />
            </div>
            <div className="space-y-1.5">
              <Label>Vùng miền</Label>
              <select
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Chọn vùng...</option>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dest-days">Số ngày gợi ý</Label>
              <Input id="dest-days" type="number" min="1" max="30" value={form.suggested_days} onChange={(e) => set('suggested_days', e.target.value)} placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-price">Giá từ (VNĐ)</Label>
              <Input id="dest-price" type="number" min="0" value={form.min_price} onChange={(e) => set('min_price', e.target.value)} placeholder="500000" />
            </div>
            <div className="space-y-1.5">
              <Label>Nổi bật</Label>
              <select
                value={form.is_featured}
                onChange={(e) => set('is_featured', e.target.value)}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="false">Không</option>
                <option value="true">Có</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh bìa</Label>
            <ImageUpload 
              value={form.cover_image} 
              onChange={(url) => set('cover_image', url)} 
              folder="destinations" 
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dest-desc">Mô tả</Label>
            <Textarea id="dest-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả điểm đến..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
