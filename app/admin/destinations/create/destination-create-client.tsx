'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Save, Search, LinkIcon, PenLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ImageUpload } from '@/components/admin/shared/image-upload'
import { adminCreateDestination } from '@/components/admin/actions/admin-crud-actions'
import { DESTINATION_TYPES } from '@/lib/constants/common'

const REGIONS = [
  { value: 'Bắc', label: 'Miền Bắc' },
  { value: 'Trung', label: 'Miền Trung' },
  { value: 'Nam', label: 'Miền Nam' },
]

const SECTIONS = [
  { key: 'info', label: 'Thông tin chung' },
  { key: 'attractions', label: 'Điểm tham quan' },
  { key: 'gallery', label: 'Album ảnh' },
  { key: 'tags', label: 'Tags' },
] as const
type SectionKey = typeof SECTIONS[number]['key']

/** Điểm tham quan mới (tạo inline) */
interface NewAttraction { name: string; description: string; image_url: string; entry_fee: number }
/** Điểm tham quan đã có trong DB */
interface ExistingAttraction { id: string; name: string; description: string | null; image_url: string | null; entry_fee: number | null; destination_id: string | null }
interface DestImage { image_url: string; caption: string }
interface Tag { id: string; name: string; slug: string }

interface Props {
  allTags: Tag[]
  existingAttractions: ExistingAttraction[]
}

export default function DestinationCreateClient({ allTags, existingAttractions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState<SectionKey>('info')

  // ── Info ──
  const [form, setForm] = useState({
    name: '', slug: '', description: '',
    destination_type: '', province: '', region: '',
    cover_image: '', is_featured: 'false', suggested_days: '', min_price: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── Tags ──
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const toggleTag = (id: string) =>
    setSelectedTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])

  // ── Gallery ──
  const [images, setImages] = useState<DestImage[]>([])

  // ── Attractions ──
  // Mode: 'link' = chọn từ DB có sẵn | 'create' = tạo mới inline
  const [attrMode, setAttrMode] = useState<'link' | 'create'>('link')

  // Linked attractions (chọn từ DB)
  const [linkedAttrIds, setLinkedAttrIds] = useState<string[]>([])
  const [attrSearch, setAttrSearch] = useState('')
  const toggleLink = (id: string) =>
    setLinkedAttrIds(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id])
  const filteredExisting = existingAttractions.filter(a =>
    !attrSearch || a.name.toLowerCase().includes(attrSearch.toLowerCase())
  )

  // New attractions (tạo mới inline)
  const [newAttractions, setNewAttractions] = useState<NewAttraction[]>([])
  const addNewAttr = () => setNewAttractions(p => [...p, { name: '', description: '', image_url: '', entry_fee: 0 }])
  const removeNewAttr = (idx: number) => setNewAttractions(p => p.filter((_, i) => i !== idx))
  const updateNewAttr = useCallback((idx: number, field: keyof NewAttraction, value: any) =>
    setNewAttractions(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: value }; return a }), [])

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Vui lòng điền tên điểm đến'); return }

    startTransition(async () => {
      // 1. Create Destination
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const result = await adminCreateDestination(fd)
      if (!result.success) { toast.error(result.error ?? 'Không thể thêm điểm đến'); return }

      // 2. Get destination ID
      try {
        const slug = form.slug || form.name.toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
        const res = await fetch(`/api/admin/destinations/get-id?slug=${encodeURIComponent(slug)}`)
        const { id: destId } = await res.json()

        if (destId) {
          const tasks: Promise<any>[] = []

          // 3a. Re-link existing attractions (update their destination_id)
          if (attrMode === 'link' && linkedAttrIds.length > 0) {
            tasks.push(
              fetch('/api/admin/destinations/link-attractions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: destId, attractionIds: linkedAttrIds }),
              })
            )
          }

          // 3b. Create new inline attractions
          if (attrMode === 'create' && newAttractions.some(a => a.name.trim())) {
            tasks.push(
              fetch('/api/admin/destinations/attractions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: destId, attractions: newAttractions.filter(a => a.name.trim()) }),
              })
            )
          }

          // 3c. Tags
          if (selectedTags.length > 0) {
            tasks.push(
              fetch('/api/admin/destinations/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: destId, tagIds: selectedTags }),
              })
            )
          }

          // 3d. Gallery
          if (images.some(img => img.image_url.trim())) {
            tasks.push(
              fetch('/api/admin/destinations/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: destId, images }),
              })
            )
          }

          await Promise.all(tasks)
        }
      } catch { /* non-critical */ }

      toast.success('Thêm điểm đến thành công!')
      router.push('/admin/destinations')
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
                  <Label>Tên điểm đến <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="tu-dong-tao-neu-de-trong" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1">
                  <Label>Loại hình <span className="text-destructive">*</span></Label>
                  <select required value={form.destination_type} onChange={e => set('destination_type', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
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
            </div>
          )}

          {/* ── Điểm tham quan ── */}
          {activeSection === 'attractions' && (
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
                  Tạo điểm tham quan mới
                </button>
              </div>

              {/* MODE: Link từ DB */}
              {attrMode === 'link' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Chọn các điểm tham quan đã có trong hệ thống để gắn vào điểm đến này. Tránh trùng lặp dữ liệu.</p>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={attrSearch}
                      onChange={e => setAttrSearch(e.target.value)}
                      placeholder="Tìm điểm tham quan..."
                      className="pl-9"
                    />
                  </div>

                  {/* Selected badges */}
                  {linkedAttrIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedAttrIds.map(id => {
                        const attr = existingAttractions.find(a => a.id === id)
                        if (!attr) return null
                        return (
                          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-medium">
                            {attr.name}
                            <button type="button" onClick={() => toggleLink(id)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-border p-3">
                    {filteredExisting.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {attrSearch ? 'Không tìm thấy kết quả' : 'Chưa có điểm tham quan nào trong hệ thống'}
                      </p>
                    ) : filteredExisting.map(attr => (
                      <label
                        key={attr.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          linkedAttrIds.includes(attr.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={linkedAttrIds.includes(attr.id)}
                          onChange={() => toggleLink(attr.id)}
                          className="accent-primary mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{attr.name}</p>
                          {attr.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{attr.description}</p>}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {(attr.entry_fee ?? 0) > 0 && <span>Vé: {attr.entry_fee!.toLocaleString('vi-VN')}đ</span>}
                            {attr.destination_id && <span className="text-amber-600">• Đã gắn điểm đến khác</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đã chọn: <strong>{linkedAttrIds.length}</strong> điểm tham quan.
                    Nếu attraction đã gắn điểm đến khác, nó sẽ được chuyển sang điểm đến mới này.
                  </p>
                </div>
              )}

              {/* MODE: Tạo mới */}
              {attrMode === 'create' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Tạo điểm tham quan mới sẽ được lưu vào bảng Attractions và gắn vào điểm đến này.</p>
                  {newAttractions.map((attr, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Điểm tham quan #{idx + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeNewAttr(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <Label className="text-xs mb-1 block">Ảnh (upload)</Label>
                          <ImageUpload
                            value={attr.image_url}
                            onChange={url => updateNewAttr(idx, 'image_url', url)}
                            folder="attractions"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Input value={attr.name} onChange={e => updateNewAttr(idx, 'name', e.target.value)} placeholder="Tên địa điểm (VD: Hang Sửng Sốt)" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={attr.entry_fee}
                              onChange={e => updateNewAttr(idx, 'entry_fee', Number(e.target.value))}
                              placeholder="Giá vé (0 = miễn phí)"
                            />
                          </div>
                          <Textarea rows={2} value={attr.description} onChange={e => updateNewAttr(idx, 'description', e.target.value)} placeholder="Mô tả ngắn..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addNewAttr} className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4 mr-2" />Thêm điểm tham quan
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Album ảnh ── */}
          {activeSection === 'gallery' && (
            <div className="space-y-3 max-w-3xl">
              <p className="text-sm text-muted-foreground">Bộ sưu tập hình ảnh điểm đến (tối đa 10 ảnh).</p>
              <div className="space-y-3">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                    <div className="w-36 shrink-0">
                      <ImageUpload value={img.image_url} onChange={url => setImages(p => { const a = [...p]; a[idx] = { ...a[idx], image_url: url }; return a })} folder="destinations" />
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

          {/* ── Tags ── */}
          {activeSection === 'tags' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-muted-foreground">Gán tags để người dùng dễ tìm kiếm điểm đến này.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allTags.map(tag => (
                  <label key={tag.id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}>
                    <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="accent-primary" />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </label>
                ))}
                {allTags.length === 0 && <p className="col-span-3 text-sm text-muted-foreground text-center py-8">Chưa có tags trong hệ thống.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div className="flex gap-1">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`h-2 w-8 rounded-full transition-colors ${s.key === activeSection ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/destinations"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></Link>
            <Button type="submit" disabled={isPending}><Save className="h-4 w-4 mr-2" />{isPending ? 'Đang tạo...' : 'Tạo Điểm đến'}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
