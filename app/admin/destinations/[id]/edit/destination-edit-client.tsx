'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Save, GripVertical, Search, LinkIcon, PenLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import { adminUpdateDestination } from '@/components/admin/actions/admin-crud-actions'
import { DESTINATION_TYPES } from '@/lib/constants/common'

const REGIONS = [
  { value: 'Bắc', label: 'Miền Bắc' },
  { value: 'Trung', label: 'Miền Trung' },
  { value: 'Nam', label: 'Miền Nam' },
]

const TABS = [
  { key: 'info', label: 'Thông tin chung' },
  { key: 'attractions', label: 'Điểm tham quan' },
  { key: 'gallery', label: 'Album ảnh' },
  { key: 'tags', label: 'Tags' },
] as const
type TabKey = typeof TABS[number]['key']

interface Attraction {
  id?: string; name: string; description: string; image_url: string; entry_fee: number; sort_order?: number
}
interface ExistingAttraction {
  id: string; name: string; description: string; image_url: string; entry_fee: number; destination_id: string | null
}
interface DestImage { id?: string; image_url: string; caption: string; sort_order?: number }
interface Tag { id: string; name: string; slug: string }

interface DestinationEditClientProps {
  destination: any
  attractions: Attraction[]
  allAttractions: ExistingAttraction[]
  destImages: DestImage[]
  allTags: Tag[]
  selectedTagIds: string[]
}

export default function DestinationEditClient({
  destination, attractions: initAttr, allAttractions,
  destImages: initImages, allTags, selectedTagIds: initSelectedTags,
}: DestinationEditClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [isPending, startTransition] = useTransition()

  // ── Info form ──
  const [form, setForm] = useState({
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
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── Attractions ── (dual-mode)
  // Detect initial mode: if existing attractions are linked, start in 'create' (inline edit) mode
  const [attrMode, setAttrMode] = useState<'link' | 'create'>(initAttr.length > 0 ? 'create' : 'link')

  // Inline attractions (current linked in DB, editable)
  const [attractions, setAttractions] = useState<Attraction[]>(initAttr.length > 0 ? initAttr : [])
  const addAttraction = () => setAttractions(p => [...p, { name: '', description: '', image_url: '', entry_fee: 0 }])
  const removeAttraction = (idx: number) => setAttractions(p => p.filter((_, i) => i !== idx))
  const updateAttraction = useCallback((idx: number, field: keyof Attraction, value: any) =>
    setAttractions(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: value }; return a }), [])

  // Link mode state
  const [attrSearch, setAttrSearch] = useState('')
  const [linkedAttrIds, setLinkedAttrIds] = useState<string[]>(initAttr.map(a => a.id!).filter(Boolean))
  const toggleLink = (id: string) =>
    setLinkedAttrIds(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id])
  const filteredExisting = allAttractions.filter(a =>
    !attrSearch || a.name.toLowerCase().includes(attrSearch.toLowerCase())
  )

  // ── Gallery ──
  const [images, setImages] = useState<DestImage[]>(initImages)

  // ── Tags ──
  const [selectedTags, setSelectedTags] = useState<string[]>(initSelectedTags)
  const toggleTag = (id: string) =>
    setSelectedTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])

  // ── Handlers ──
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('id', destination.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const result = await adminUpdateDestination(fd)
      if (result.success) { toast.success('Đã lưu thông tin'); router.refresh() }
      else toast.error(result.error ?? 'Có lỗi xảy ra')
    })
  }

  const handleSaveAttractions = () => {
    startTransition(async () => {
      try {
        if (attrMode === 'create') {
          // Save edited inline list
          const res = await fetch('/api/admin/destinations/attractions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationId: destination.id, attractions }),
          })
          const data = await res.json()
          if (res.ok) { toast.success('Đã lưu điểm tham quan'); router.refresh() }
          else toast.error(data.error ?? 'Lỗi lưu dữ liệu')
        } else {
          // Link mode: update destination_id for selected attractions
          const res = await fetch('/api/admin/destinations/link-attractions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationId: destination.id, attractionIds: linkedAttrIds }),
          })
          const data = await res.json()
          if (res.ok) { toast.success('Đã liên kết điểm tham quan'); router.refresh() }
          else toast.error(data.error ?? 'Lỗi liên kết')
        }
      } catch { toast.error('Lỗi kết nối') }
    })
  }

  const handleSaveGallery = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/destinations/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationId: destination.id, images }),
        })
        const data = await res.json()
        if (res.ok) { toast.success('Đã lưu album ảnh'); router.refresh() }
        else toast.error(data.error ?? 'Lỗi lưu ảnh')
      } catch { toast.error('Lỗi kết nối') }
    })
  }

  const handleSaveTags = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/destinations/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationId: destination.id, tagIds: selectedTags }),
        })
        const data = await res.json()
        if (res.ok) { toast.success('Đã lưu tags'); router.refresh() }
        else toast.error(data.error ?? 'Lỗi lưu tags')
      } catch { toast.error('Lỗi kết nối') }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                <Label>Tên điểm đến <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={e => set('slug', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-1">
                <Label>Loại hình</Label>
                <select value={form.destination_type} onChange={e => set('destination_type', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">-- Chọn --</option>
                  {DESTINATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Tỉnh/Thành phố</Label>
                <Input value={form.province} onChange={e => set('province', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Vùng miền</Label>
                <select value={form.region} onChange={e => set('region', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">-- Chọn --</option>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-1">
                <Label>Số ngày gợi ý</Label>
                <Input type="number" min="1" value={form.suggested_days} onChange={e => set('suggested_days', e.target.value)} />
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
              <ImageUpload value={form.cover_image} onChange={url => set('cover_image', url)} folder="destinations" />
            </div>

            <div className="space-y-1">
              <Label>Mô tả chi tiết</Label>
              <Textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/destinations"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : 'Lưu thông tin'}</Button>
            </div>
          </form>
        )}

        {/* ── Tab: Điểm tham quan ── */}
        {activeTab === 'attractions' && (
          <div className="space-y-5 max-w-3xl">
            {/* Mode toggle */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setAttrMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  attrMode === 'link' ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Chọn từ danh sách có sẵn
              </button>
              <div className="w-px bg-border" />
              <button
                type="button"
                onClick={() => setAttrMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  attrMode === 'create' ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <PenLine className="h-4 w-4" />
                Tạo / Sửa điểm tham quan
              </button>
            </div>

            {/* MODE: Link từ DB */}
            {attrMode === 'link' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Chọn các điểm tham quan đã có trong hệ thống để gắn vào điểm đến này, tránh tạo trùng lặp.</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={attrSearch} onChange={e => setAttrSearch(e.target.value)} placeholder="Tìm điểm tham quan..." className="pl-9" />
                </div>

                {linkedAttrIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedAttrIds.map(id => {
                      const attr = allAttractions.find(a => a.id === id)
                      if (!attr) return null
                      return (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-medium">
                          {attr.name}
                          <button type="button" onClick={() => toggleLink(id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-border p-3">
                  {filteredExisting.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Không tìm thấy điểm tham quan</p>
                  ) : filteredExisting.map(attr => (
                    <label key={attr.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      linkedAttrIds.includes(attr.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}>
                      <input type="checkbox" checked={linkedAttrIds.includes(attr.id)} onChange={() => toggleLink(attr.id)} className="accent-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{attr.name}</p>
                        {attr.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{attr.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {attr.entry_fee > 0 && <span>Vé: {attr.entry_fee.toLocaleString('vi-VN')}đ</span>}
                          {attr.destination_id && attr.destination_id !== destination.id && (
                            <span className="text-amber-600">• Đang gắn điểm đến khác</span>
                          )}
                          {attr.destination_id === destination.id && (
                            <span className="text-green-600">• Đang gắn đây</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Đã chọn: <strong>{linkedAttrIds.length}</strong> điểm tham quan</p>
              </div>
            )}

            {/* MODE: Tạo mới / sửa inline */}
            {attrMode === 'create' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Thêm, sửa, xóa trực tiếp các điểm tham quan thuộc điểm đến này. Ảnh được upload lên Supabase Storage.</p>
                {attractions.map((attr, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Điểm tham quan #{idx + 1}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAttraction(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-1 space-y-2">
                        <Label className="text-xs">Ảnh đại diện</Label>
                        <ImageUpload value={attr.image_url} onChange={url => updateAttraction(idx, 'image_url', url)} folder="attractions" />
                      </div>
                      <div className="col-span-2 space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Tên địa điểm <span className="text-destructive">*</span></Label>
                          <Input value={attr.name} onChange={e => updateAttraction(idx, 'name', e.target.value)} placeholder="VD: Hang Sửng Sốt" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Giá vé (VNĐ, 0 = miễn phí)</Label>
                          <Input type="number" min="0" value={attr.entry_fee} onChange={e => updateAttraction(idx, 'entry_fee', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Mô tả</Label>
                          <Textarea rows={3} value={attr.description} onChange={e => updateAttraction(idx, 'description', e.target.value)} placeholder="Mô tả ngắn về địa điểm..." />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAttraction} className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4 mr-2" />Thêm điểm tham quan mới
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/destinations"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="button" onClick={handleSaveAttractions} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : attrMode === 'link' ? 'Lưu liên kết' : 'Lưu danh sách'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab: Album ảnh ── */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">Tối đa 10 ảnh cho bộ sưu tập điểm đến.</p>
            <div className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="w-36 shrink-0">
                    <ImageUpload value={img.image_url} onChange={url => setImages(p => { const a = [...p]; a[idx] = { ...a[idx], image_url: url }; return a })} folder="destinations" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Mô tả ảnh</Label>
                      <Input value={img.caption} onChange={e => setImages(p => { const a = [...p]; a[idx] = { ...a[idx], caption: e.target.value }; return a })} placeholder="VD: Toàn cảnh từ trên cao" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setImages(p => p.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs">
                      <Trash2 className="h-3 w-3 mr-1" />Xóa ảnh
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
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/destinations"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="button" onClick={handleSaveGallery} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : 'Lưu album'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab: Tags ── */}
        {activeTab === 'tags' && (
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">Chọn các tags phù hợp để người dùng dễ tìm kiếm điểm đến này.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allTags.map(tag => (
                <label key={tag.id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedTags.includes(tag.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}>
                  <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="accent-primary" />
                  <span className="text-sm font-medium">{tag.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/admin/destinations"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
              <Button type="button" onClick={handleSaveTags} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />{isPending ? 'Đang lưu...' : 'Lưu tags'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
