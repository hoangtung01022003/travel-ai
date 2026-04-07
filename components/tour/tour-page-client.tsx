'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Clock, Users, SlidersHorizontal,
  CalendarDays, X, ChevronDown, ChevronUp, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/common'
import { Tour } from '@/types/tour'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchInput } from '../common/search-input'

interface TourPageClientProps {
  tours: Tour[]
  totalCount: number
}

const PRICE_RANGES = [
  { label: 'Dưới 2M', min: 0, max: 2000000 },
  { label: '2M – 5M', min: 2000000, max: 5000000 },
  { label: '5M – 10M', min: 5000000, max: 10000000 },
  { label: 'Trên 10M', min: 10000000, max: 0 },
]

const DURATION_OPTIONS = [
  { label: '1-3 ngày', min: 1, max: 3 },
  { label: '4-7 ngày', min: 4, max: 7 },
  { label: '8-14 ngày', min: 8, max: 14 },
  { label: 'Trên 14 ngày', min: 15, max: 0 },
]

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 select-none border ${
        active
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/40'
      }`}
    >
      {children}
    </button>
  )
}

export const TourPageClient = ({ tours, totalCount }: TourPageClientProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const keyword  = searchParams.get('keyword') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const minDays  = searchParams.get('minDays') || ''
  const maxDays  = searchParams.get('maxDays') || ''

  const activeFilterCount = [minPrice || maxPrice, minDays || maxDays].filter(Boolean).length

  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key)
      else params.set(key, val)
    })
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const clearAllFilters = () => router.push('/tours')

  const currentPriceLabel = PRICE_RANGES.find(
    r => String(r.min) === minPrice && String(r.max) === maxPrice
  )?.label ?? null

  const currentDurationLabel = DURATION_OPTIONS.find(
    r => String(r.min) === minDays && String(r.max) === maxDays
  )?.label ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
          Tour du lịch <span className="text-gradient">hấp dẫn</span>
        </h1>
        <p className="text-muted-foreground">
          Hành trình được thiết kế bởi chuyên gia, trải nghiệm không giới hạn
        </p>
      </div>

      {/* Filter Panel */}
      <div className="border-border mb-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <SearchInput
            className="flex-1"
            placeholder="Tìm tour theo tên, mô tả..."
            value={keyword}
            onChange={(v) => pushParams({ keyword: v || null })}
          />
          <Button
            variant="outline"
            className="relative gap-2"
            onClick={() => setShowAdvanced(s => !s)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-border px-4 py-4">
                {/* Price */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    💰 Khoảng giá (mỗi người)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      active={!minPrice && !maxPrice}
                      onClick={() => pushParams({ minPrice: null, maxPrice: null })}
                    >
                      Tất cả
                    </FilterPill>
                    {PRICE_RANGES.map(r => (
                      <FilterPill
                        key={r.label}
                        active={currentPriceLabel === r.label}
                        onClick={() => pushParams({
                          minPrice: r.min > 0 ? String(r.min) : null,
                          maxPrice: r.max > 0 ? String(r.max) : null,
                        })}
                      >
                        {r.label}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Thời gian tour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      active={!minDays && !maxDays}
                      onClick={() => pushParams({ minDays: null, maxDays: null })}
                    >
                      Tất cả
                    </FilterPill>
                    {DURATION_OPTIONS.map(r => (
                      <FilterPill
                        key={r.label}
                        active={currentDurationLabel === r.label}
                        onClick={() => pushParams({
                          minDays: String(r.min),
                          maxDays: r.max > 0 ? String(r.max) : null,
                        })}
                      >
                        {r.label}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 border-t border-border/50 bg-muted/30 px-4 py-2.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{activeFilterCount} bộ lọc đang áp dụng</span>
            <button
              onClick={clearAllFilters}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Xóa tất cả
            </button>
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{totalCount} tour được tìm thấy</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tours.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Không tìm thấy tour</h3>
            <p className="text-muted-foreground mb-4">Thử thay đổi bộ lọc</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters} className="gap-2">
                <X className="h-4 w-4" /> Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : tours.map((tour, index) => (
          <motion.div
            key={tour.id as string}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Link href={`/tours/${tour.slug}`}>
              <div className="group border-border card-hover overflow-hidden rounded-2xl border bg-white">
                <div className="relative h-56 overflow-hidden">
                  {tour.cover_image ? (
                    <Image src={tour.cover_image as string} alt={tour.name as string} fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <MapPin className="text-muted-foreground h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="warning">{tour.duration_days as number}N{(tour.duration_days as number) - 1}Đ</Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 backdrop-blur-sm">
                    <Star className="fill-warning text-warning h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{Number(tour.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="group-hover:text-primary mb-1 text-lg font-semibold transition-colors">{tour.name as string}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{tour.description as string}</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="muted" className="gap-1">
                      <Clock className="h-3 w-3" /> {tour.duration_days as number} ngày
                    </Badge>
                    <Badge variant="muted" className="gap-1">
                      <Users className="h-3 w-3" /> Max {(tour.max_group_size as number) || 20}
                    </Badge>
                  </div>
                  <div className="border-border flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-primary text-lg font-bold">{formatPrice(Number(tour.price))}</span>
                      <span className="text-muted-foreground text-xs"> /người</span>
                    </div>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />{tour.review_count as number} đánh giá
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
