'use client'

import { useState, useMemo } from 'react'
import {
  Hotel, Star, Search, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/common'
import { AdminDeleteButton } from '@/components/admin/shared/admin-delete-button'
import { adminDeleteHotel } from '@/components/admin/actions/admin-crud-actions'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

type HotelType = any // Replace with proper type later if needed
type Destination = { id: string; name: string }

interface HotelsClientProps {
  hotels: HotelType[]
  destinations: Destination[]
}

const PAGE_SIZE = 20

export default function HotelsClient({ hotels, destinations }: HotelsClientProps) {
  const [search, setSearch] = useState('')
  const [starFilter, setStarFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.province?.toLowerCase().includes(search.toLowerCase())
      const matchStar = starFilter === 'all' || h.star_rating?.toString() === starFilter
      
      return matchSearch && matchStar
    })
  }, [hotels, search, starFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const resetPage = () => setPage(1)

  const featuredCount = hotels.filter((h) => h.is_featured).length

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khách sạn</h1>
          <p className="text-sm text-muted-foreground">{hotels.length} khách sạn (Nổi bật: {featuredCount})</p>
        </div>
        <Link href="/admin/hotels/create">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Thêm khách sạn
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
              placeholder="Tìm theo tên khách sạn hoặc tỉnh..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['all', '5', '4', '3', '2', '1'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStarFilter(s); resetPage() }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  starFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {s === 'all' ? 'Tất cả' : `${s} sao`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-medium">Danh sách Khách sạn</p>
        </div>

        {pageData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy khách sạn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border text-left text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Tên Khách sạn</th>
                  <th className="px-4 py-3">Địa điểm</th>
                  <th className="px-4 py-3 text-center">Hạng</th>
                  <th className="px-4 py-3">Giá từ</th>
                  <th className="px-4 py-3 text-center">Đánh giá</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((hotel) => (
                  <tr key={hotel.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{hotel.name}</span>
                        {hotel.is_featured && <Badge variant="default" className="text-[10px] px-1.5 py-0">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{hotel.province || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-400">{'★'.repeat(hotel.star_rating || 0)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                      {hotel.min_price ? formatPrice(hotel.min_price) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-0.5">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {Number(hotel.avg_rating ?? 0).toFixed(1)}
                        <span className="text-muted-foreground text-xs">({hotel.review_count ?? 0})</span>
                      </span>
                    </td>
                      <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/hotels/${hotel.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Sửa</span>
                          </Button>
                        </Link>
                        <AdminDeleteButton id={hotel.id} entityName={hotel.name} action={adminDeleteHotel} />
                      </div>
                    </td>
                  </tr>
                ))}
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
