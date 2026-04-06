'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Save, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import { adminCreateTour } from '@/components/admin/actions/admin-crud-actions'

interface Itinerary {
  day_number: number
  title: string
  description: string
}

export default function TourCreateClient({ destinations }: { destinations: { id: string; name: string }[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    duration_days: '',
    max_group_size: '',
    is_active: 'true',
    destination_id: '',
    cover_image: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [itineraries, setItineraries] = useState<Itinerary[]>([
    { day_number: 1, title: 'Ngày 1: ', description: '' },
  ])
  const addDay = () => {
    const next = itineraries.length + 1
    setItineraries(p => [...p, { day_number: next, title: `Ngày ${next}: `, description: '' }])
  }
  const removeDay = (idx: number) =>
    setItineraries(p => p.filter((_, i) => i !== idx).map((it, i) => ({ ...it, day_number: i + 1 })))
  const updateDay = useCallback((idx: number, field: keyof Itinerary, value: string) =>
    setItineraries(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: value }; return a }), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.duration_days) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    startTransition(async () => {
      // 1. Create Tour
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const result = await adminCreateTour(fd)

      if (!result.success) {
        toast.error(result.error ?? 'Không thể thêm tour')
        return
      }

      // 2. Get newly created tour ID to save itineraries
      // (Server action returns success but not ID, so we fetch it)
      try {
        const slug = form.slug || form.name.toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

        const res = await fetch(`/api/admin/tours/get-id?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.id && itineraries.some(it => it.title.trim())) {
          await fetch('/api/admin/tours/itineraries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourId: data.id, itineraries }),
          })
        }
      } catch {
        // Lịch trình có thể thêm sau khi vào Edit, không critical
      }

      toast.success('Thêm tour thành công!')
      router.push('/admin/tours')
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* ── Thông tin chung ── */}
        <div className="p-6 space-y-5 border-b border-border">
          <h2 className="text-base font-semibold">Thông tin chung</h2>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label>Tên tour <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="tu-dong-tao-neu-de-trong" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1">
              <Label>Giá (VNĐ) <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Số ngày <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" value={form.duration_days} onChange={e => set('duration_days', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Nhóm tối đa</Label>
              <Input type="number" min="1" value={form.max_group_size} onChange={e => set('max_group_size', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label>Điểm đến</Label>
              <select value={form.destination_id} onChange={e => set('destination_id', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">-- Chọn điểm đến --</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <select value={form.is_active} onChange={e => set('is_active', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="true">✅ Hoạt động</option>
                <option value="false">⏸ Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Ảnh bìa chính</Label>
            <ImageUpload value={form.cover_image} onChange={url => set('cover_image', url)} folder="tours" />
          </div>

          <div className="space-y-1">
            <Label>Mô tả chi tiết</Label>
            <Textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả hấp dẫn, nội dung tour..." />
          </div>
        </div>

        {/* ── Lịch trình ── */}
        <div className="p-6 space-y-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Lịch trình tour</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Thêm lịch trình ngay khi tạo. Bạn cũng có thể bổ sung sau tại trang Edit.</p>
            </div>
          </div>

          <div className="space-y-4">
            {itineraries.map((itin, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-primary">Ngày {itin.day_number}</span>
                  </div>
                  {itineraries.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDay(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Input value={itin.title} onChange={e => updateDay(idx, 'title', e.target.value)} placeholder={`VD: Ngày ${itin.day_number}: Khởi hành & Khám phá...`} />
                  <Textarea rows={3} value={itin.description} onChange={e => updateDay(idx, 'description', e.target.value)} placeholder="Mô tả chi tiết các hoạt động..." />
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addDay} className="w-full border-dashed border-2 h-10 text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4 mr-2" />Thêm ngày
          </Button>
        </div>

        <div className="flex justify-end gap-3 p-6">
          <Link href="/admin/tours"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
          <Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{isPending ? 'Đang tạo...' : 'Tạo Tour'}</Button>
        </div>
      </form>
    </div>
  )
}
