'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Save, Check, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import { adminCreateHotel } from '@/components/admin/actions/admin-crud-actions'

const BED_TYPES = ['Single', 'Twin', 'Double', 'Queen', 'King', 'Bunk']

const SECTIONS = [
  { key: 'info', label: 'Thông tin chung' },
  { key: 'rooms', label: 'Loại phòng' },
  { key: 'gallery', label: 'Album ảnh' },
  { key: 'amenities', label: 'Tiện nghi' },
  { key: 'tags', label: 'Tags' },
] as const
type SectionKey = typeof SECTIONS[number]['key']

interface RoomType {
  name: string; description: string; price_per_night: number
  max_guests: number; bed_type: string; room_size: number
  image_url: string; is_available: boolean
}
interface HotelImage { image_url: string; caption: string }
interface Amenity { id: string; name: string; icon: string | null; category: string | null }
interface Tag { id: string; name: string; slug: string }

interface Props {
  destinations: { id: string; name: string }[]
  allAmenities: Amenity[]
  allTags: Tag[]
}

export default function HotelCreateClient({ destinations, allAmenities, allTags }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState<SectionKey>('info')

  const [form, setForm] = useState({
    name: '', slug: '', description: '', address: '', province: '',
    destination_id: '', star_rating: '', min_price: '', cover_image: '', is_featured: 'false',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [rooms, setRooms] = useState<RoomType[]>([])
  const addRoom = () => setRooms(p => [...p, { name: '', description: '', price_per_night: 0, max_guests: 2, bed_type: 'Double', room_size: 0, image_url: '', is_available: true }])
  const removeRoom = (idx: number) => setRooms(p => p.filter((_, i) => i !== idx))
  const updateRoom = useCallback((idx: number, field: keyof RoomType, value: any) =>
    setRooms(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: value }; return a }), [])

  const [images, setImages] = useState<HotelImage[]>([])

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const toggleAmenity = (id: string) =>
    setSelectedAmenities(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const toggleTag = (id: string) =>
    setSelectedTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])

  const amenityGroups = allAmenities.reduce((acc, a) => {
    const cat = a.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {} as Record<string, Amenity[]>)
  const catLabels: Record<string, string> = { general: 'Chung', hotel: 'Khách sạn', room: 'Phòng nghỉ' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Vui lòng điền tên khách sạn'); return }

    startTransition(async () => {
      // 1. Create Hotel
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const result = await adminCreateHotel(fd)
      if (!result.success) { toast.error(result.error ?? 'Không thể thêm khách sạn'); return }

      // 2. Get hotel ID
      try {
        const slug = form.slug || form.name.toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
        const res = await fetch(`/api/admin/hotels/get-id?slug=${encodeURIComponent(slug)}`)
        const { id } = await res.json()

        if (id) {
          // 3. Save rooms, images, amenities, tags in parallel
          await Promise.all([
            rooms.some(r => r.name.trim() && r.price_per_night > 0) &&
              fetch('/api/admin/hotels/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId: id, rooms }) }),
            images.some(img => img.image_url.trim()) &&
              fetch('/api/admin/hotels/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId: id, images }) }),
            selectedAmenities.length > 0 &&
              fetch('/api/admin/hotels/amenities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId: id, amenityIds: selectedAmenities }) }),
            selectedTags.length > 0 &&
              fetch('/api/admin/hotels/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelId: id, tagIds: selectedTags }) }),
          ])
        }
      } catch { /* non-critical, data can be added in Edit */ }

      toast.success('Thêm khách sạn thành công!')
      router.push('/admin/hotels')
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Section Nav */}
      <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActiveSection(s.key)}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSection === s.key
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6">

          {/* ── Thông tin chung ── */}
          {activeSection === 'info' && (
            <div className="space-y-5 max-w-3xl">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <Label>Tên Khách sạn <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="tu-dong-tao-neu-de-trong" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1">
                  <Label>Điểm đến</Label>
                  <select value={form.destination_id} onChange={e => set('destination_id', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">-- Chọn --</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Địa chỉ chi tiết</Label>
                  <Input value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-5">
                <div className="space-y-1">
                  <Label>Tỉnh/TP</Label>
                  <Input value={form.province} onChange={e => set('province', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Số sao (1-5)</Label>
                  <Input type="number" min="1" max="5" value={form.star_rating} onChange={e => set('star_rating', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Giá từ (VNĐ)</Label>
                  <Input type="number" min="0" value={form.min_price} onChange={e => set('min_price', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Nổi bật</Label>
                  <select value={form.is_featured} onChange={e => set('is_featured', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="false">Không</option>
                    <option value="true">✅ Có</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Ảnh bìa chính</Label>
                <ImageUpload value={form.cover_image} onChange={url => set('cover_image', url)} folder="hotels" />
              </div>
              <div className="space-y-1">
                <Label>Mô tả chi tiết</Label>
                <Textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Loại phòng ── */}
          {activeSection === 'rooms' && (
            <div className="space-y-4 max-w-4xl">
              <p className="text-sm text-muted-foreground">Thêm các loại phòng nghỉ trong khách sạn.</p>
              <div className="space-y-5">
                {rooms.map((room, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold">Loại phòng #{idx + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRoom(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-1">
                        <Label className="text-xs mb-1 block">Ảnh phòng</Label>
                        <ImageUpload value={room.image_url} onChange={url => updateRoom(idx, 'image_url', url)} folder="hotels" />
                      </div>
                      <div className="col-span-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Tên phòng <span className="text-destructive">*</span></Label>
                            <Input value={room.name} onChange={e => updateRoom(idx, 'name', e.target.value)} placeholder="VD: Deluxe Ocean View" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giá/đêm (VNĐ) <span className="text-destructive">*</span></Label>
                            <Input type="number" min="0" value={room.price_per_night} onChange={e => updateRoom(idx, 'price_per_night', Number(e.target.value))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Số khách tối đa</Label>
                            <Input type="number" min="1" value={room.max_guests} onChange={e => updateRoom(idx, 'max_guests', Number(e.target.value))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Loại giường</Label>
                            <select value={room.bed_type} onChange={e => updateRoom(idx, 'bed_type', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                              {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Diện tích (m²)</Label>
                            <Input type="number" min="0" value={room.room_size} onChange={e => updateRoom(idx, 'room_size', Number(e.target.value))} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Mô tả phòng</Label>
                          <Textarea rows={2} value={room.description} onChange={e => updateRoom(idx, 'description', e.target.value)} placeholder="Mô tả tóm tắt..." />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="checkbox" checked={room.is_available} onChange={e => updateRoom(idx, 'is_available', e.target.checked)} className="accent-primary" />
                          Còn phòng trống
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addRoom} className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4 mr-2" />Thêm loại phòng
              </Button>
            </div>
          )}

          {/* ── Album ảnh ── */}
          {activeSection === 'gallery' && (
            <div className="space-y-3 max-w-3xl">
              <p className="text-sm text-muted-foreground">Bộ sưu tập hình ảnh khách sạn (tối đa 10 ảnh).</p>
              <div className="space-y-3">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                    <div className="w-36 shrink-0">
                      <ImageUpload value={img.image_url} onChange={url => setImages(p => { const a = [...p]; a[idx] = { ...a[idx], image_url: url }; return a })} folder="hotels" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input value={img.caption} onChange={e => setImages(p => { const a = [...p]; a[idx] = { ...a[idx], caption: e.target.value }; return a })} placeholder="Caption / mô tả ảnh..." />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setImages(p => p.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" />Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {images.length < 10 && (
                <Button type="button" variant="outline" onClick={() => setImages(p => [...p, { image_url: '', caption: '' }])} className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4 mr-2" />Thêm ảnh (còn {10 - images.length} slot)
                </Button>
              )}
            </div>
          )}

          {/* ── Tiện nghi ── */}
          {activeSection === 'amenities' && (
            <div className="space-y-5 max-w-3xl">
              <p className="text-sm text-muted-foreground">Chọn các tiện nghi có trong khách sạn.</p>
              {Object.entries(amenityGroups).map(([cat, ams]) => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{catLabels[cat] ?? cat}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ams.map(a => (
                      <label key={a.id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedAmenities.includes(a.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}>
                        <input type="checkbox" checked={selectedAmenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} className="accent-primary" />
                        <span className="text-sm">{a.name}</span>
                        {selectedAmenities.includes(a.id) && <Check className="h-3 w-3 text-primary ml-auto" />}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {allAmenities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có tiện nghi nào trong hệ thống. Hãy thêm tại trang <strong>Cấu hình</strong>.</p>
              )}
            </div>
          )}

          {/* ── Tags ── */}
          {activeSection === 'tags' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-muted-foreground">Gán tags để người dùng dễ tìm kiếm khách sạn.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allTags.map(tag => (
                  <label key={tag.id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}>
                    <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="accent-primary" />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </label>
                ))}
                {allTags.length === 0 && <p className="col-span-3 text-sm text-muted-foreground text-center py-8">Chưa có tags. Thêm tại trang quản lý Tags.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer hành động */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div className="flex gap-1">
            {SECTIONS.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`h-2 w-8 rounded-full transition-colors ${s.key === activeSection ? 'bg-primary' : 'bg-border'}`}
                aria-label={s.label}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/hotels"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
            <Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{isPending ? 'Đang tạo...' : 'Tạo Khách sạn'}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
