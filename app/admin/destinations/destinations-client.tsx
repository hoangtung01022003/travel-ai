'use client'

import { useState, useMemo } from 'react'
import {
  MapPin, Star, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, Pencil
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/common'
import { DESTINATION_TYPES } from '@/lib/constants/common'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteDestination } from '@/components/admin/actions/admin-crud-actions'
import Link from 'next/link'

type Destination = any

interface DestinationsClientProps {
  destinations: Destination[]
}

const PAGE_SIZE = 20

export default function DestinationsClient({ destinations }: DestinationsClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchSearch = !search || 
        d.name.toLowerCase().includes(search.toLowerCase()) || 
        d.province?.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || d.destination_type === typeFilter
      
      return matchSearch && matchType
    })
  }, [destinations, search, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const resetPage = () => setPage(1)

  const featuredCount = destinations.filter((d) => d.is_featured).length

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Điểm đến</h1>
          <p className="text-sm text-muted-foreground">{destinations.length} điểm đến (Nổi bật: {featuredCount})</p>
        </div>
        <Link href="/admin/destinations/create">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Thêm điểm đến
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc tỉnh/TP..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); resetPage() }}
              className="border-input bg-background rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-muted-foreground"
            >
              <option value="all">Tất cả loại hình</option>
              {DESTINATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-medium">Danh sách Điểm đến</p>
        </div>

        {pageData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy điểm đến nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border text-left text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Tên Điểm đến</th>
                  <th className="px-4 py-3">Loại hình</th>
                  <th className="px-4 py-3">Tỉnh/Thành phố</th>
                  <th className="px-4 py-3">Tham khảo</th>
                  <th className="px-4 py-3 text-center">Đánh giá</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((dest) => {
                  const typeInfo = DESTINATION_TYPES.find((t) => t.value === dest.destination_type)
                  return (
                    <tr key={dest.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{dest.name}</span>
                          {dest.is_featured && <Badge variant="default" className="text-[10px] px-1.5 py-0">Featured</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span>{typeInfo?.icon ?? '📍'}</span>
                          {typeInfo?.label ?? dest.destination_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {dest.province || dest.region || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {dest.min_price && <span className="font-medium text-primary">{formatPrice(dest.min_price)}</span>}
                          {dest.suggested_days && <span>Gợi ý: {dest.suggested_days} ngày</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {Number(dest.avg_rating ?? 0).toFixed(1)}
                          <span className="text-muted-foreground text-xs">({dest.review_count ?? 0})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/destinations/${dest.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Sửa</span>
                            </Button>
                          </Link>
                          <AdminDeleteButton id={dest.id} entityName={dest.name} action={adminDeleteDestination} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Trang {page}/{totalPages}</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <div key={p} className="flex items-center gap-1">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                  <Button size="sm" variant={p === page ? 'default' : 'outline'} className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
