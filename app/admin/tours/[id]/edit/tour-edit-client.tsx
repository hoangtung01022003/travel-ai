'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Save, GripVertical, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import { adminUpdateTour } from '@/components/admin/actions/admin-crud-actions'

const TABS = [
  { key: 'info', label: 'Thông tin chung' },
  { key: 'itinerary', label: 'Lịch trình' },
] as const
type TabKey = typeof TABS[number]['key']

interface Itinerary {
  id?: string
  day_number: number
  title: string | null
  description: string | null
  sort_order?: number | null
}

interface TourEditClientProps {
  tour: any
  destinations: { id: string; name: string }[]
  itineraries: Itinerary[]
}

export default function TourEditClient({ tour, destinations, itineraries: initialItin }: TourEditClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name: tour.name ?? '',
    slug: tour.slug ?? '',
    description: tour.description ?? '',
    price: tour.price?.toString() ?? '',
    duration_days: tour.duration_days?.toString() ?? '',
    max_group_size: tour.max_group_size?.toString() ?? '',
    is_active: tour.is_active !== false ? 'true' : 'false',
    destination_id: tour.destination_id ?? '',
    cover_image: tour.cover_image ?? '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [itineraries, setItineraries] = useState<Itinerary[]>(
    initialItin.length > 0
      ? initialItin
      : [{ day_number: 1, title: 'Ngày 1: ', description: '' }]
  )

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('id', tour.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const result = await adminUpdateTour(fd)
      if (result.success) {
        toast.success('Đã lưu thông tin tour')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  const addDay = () => {
    const nextDay = itineraries.length + 1
    setItineraries(p => [...p, { day_number: nextDay, title: `Ngày ${nextDay}: `, description: '' }])
  }

  const removeDay = (idx: number) => {
    setItineraries(p => {
      const arr = [...p]
      arr.splice(idx, 1)
      return arr.map((item, i) => ({ ...item, day_number: i + 1 }))
    })
  }

  const updateDay = useCallback((idx: number, field: keyof Itinerary, value: string) => {
    setItineraries(p => {
      const arr = [...p]
      arr[idx] = { ...arr[idx], [field]: value }
      return arr
    })
  }, [])

  const handleSaveItinerary = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/tours/itineraries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourId: tour.id, itineraries }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Đã lưu lịch trình')
          router.refresh()
        } else {
          toast.error(data.error ?? 'Lỗi lưu lịch trình')
        }
      } catch {
        toast.error('Lỗi kết nối')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-border bg-muted/30">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── Tab: Thông tin chung ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="space-y-5 max-w-3xl">
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
                <select
                  value={form.destination_id}
                  onChange={e => set('destination_id', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Chọn điểm đến --</option>
                  {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Trạng thái</Label>
                <select
                  value={form.is_active}
                  onChange={e => set('is_active', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
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
              <Textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả hấp dẫn về tour..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/tours"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : 'Lưu thông tin'}</Button>
            </div>
          </form>
        )}

        {/* ── Tab: Lịch trình ── */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">Thêm, sửa, xóa các ngày trong lịch trình tour. Thứ tự ngày sẽ được tự động đánh số lại.</p>

            <div className="space-y-4">
              {itineraries.map((itin, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-primary">Ngày {itin.day_number}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(idx)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tiêu đề ngày</Label>
                      <Input
                        value={itin.title ?? ''}
                        onChange={e => updateDay(idx, 'title', e.target.value)}
                        placeholder={`VD: Ngày ${itin.day_number}: Khởi hành & Khám phá...`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hoạt động chi tiết</Label>
                      <Textarea
                        rows={4}
                        value={itin.description ?? ''}
                        onChange={e => updateDay(idx, 'description', e.target.value)}
                        placeholder="Mô tả các hoạt động trong ngày này..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addDay}
              className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />Thêm ngày mới
            </Button>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/tours"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="button" onClick={handleSaveItinerary} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : 'Lưu lịch trình'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
