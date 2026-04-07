'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MapPin, SlidersHorizontal, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/common'
import { Hotel } from '@/types/hotel'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchInput } from '../common/search-input'

interface HotelPageClientProps {
  hotels: Hotel[]
  totalCount: number
}

const PRICE_RANGES = [
  { label: 'Dưới 500K', min: 0, max: 500000 },
  { label: '500K – 1.5M', min: 500000, max: 1500000 },
  { label: '1.5M – 3M', min: 1500000, max: 3000000 },
  { label: 'Trên 3M', min: 3000000, max: 0 },
]

const RATING_OPTIONS = [
  { value: '4.5', label: '4.5+ ⭐' },
  { value: '4', label: '4.0+ ⭐' },
  { value: '3.5', label: '3.5+ ⭐' },
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

export const HotelPageClient = ({ hotels, totalCount }: HotelPageClientProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const keyword      = searchParams.get('keyword') || ''
  const selectedStar = searchParams.get('starRating') || ''
  const minPrice     = searchParams.get('minPrice') || ''
  const maxPrice     = searchParams.get('maxPrice') || ''
  const minRating    = searchParams.get('minRating') || ''

  const activeFilterCount = [selectedStar, minPrice || maxPrice, minRating].filter(Boolean).length

  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key)
      else params.set(key, val)
    })
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const clearAllFilters = () => router.push('/hotels')

  const currentPriceLabel = PRICE_RANGES.find(
    r => String(r.min) === minPrice && String(r.max) === maxPrice
  )?.label ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
          Khách sạn <span className="text-gradient">chất lượng</span>
        </h1>
        <p className="text-muted-foreground">Tìm nơi lưu trú hoàn hảo cho chuyến đi của bạn</p>
      </div>

      {/* Filter Panel */}
      <div className="border-border mb-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <SearchInput
            className="flex-1"
            placeholder="Tìm theo tên khách sạn, tỉnh thành..."
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

        {/* Star filter — always visible */}
        <div className="flex flex-wrap gap-2 border-t border-border/50 px-4 py-3">
          <FilterPill active={!selectedStar} onClick={() => pushParams({ starRating: null })}>
            Tất cả sao
          </FilterPill>
          {[1, 2, 3, 4, 5].map(s => (
            <FilterPill
              key={s}
              active={selectedStar === String(s)}
              onClick={() => pushParams({ starRating: selectedStar === String(s) ? null : String(s) })}
            >
              {s} ⭐
            </FilterPill>
          ))}
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
                    💰 Giá/đêm
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

                {/* Rating */}
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Star className="h-3.5 w-3.5" /> Đánh giá tối thiểu
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill active={!minRating} onClick={() => pushParams({ minRating: null })}>
                      Tất cả
                    </FilterPill>
                    {RATING_OPTIONS.map(r => (
                      <FilterPill
                        key={r.value}
                        active={minRating === r.value}
                        onClick={() => pushParams({ minRating: minRating === r.value ? null : r.value })}
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

      <p className="mb-4 text-sm text-muted-foreground">{totalCount} khách sạn được tìm thấy</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Không tìm thấy khách sạn</h3>
            <p className="text-muted-foreground mb-4">Thử thay đổi bộ lọc</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters} className="gap-2">
                <X className="h-4 w-4" /> Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : hotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Link href={`/hotels/${hotel.slug}`}>
              <div className="group border-border card-hover overflow-hidden rounded-2xl border bg-white">
                <div className="relative h-56 overflow-hidden">
                  {hotel.cover_image ? (
                    <Image src={hotel.cover_image} alt={hotel.name} fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <MapPin className="text-muted-foreground h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 backdrop-blur-sm">
                    <Star className="fill-warning text-warning h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{Number(hotel.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                        <Star key={i} className="fill-warning text-warning h-3.5 w-3.5" />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-xs">{hotel.review_count} đánh giá</span>
                  </div>
                  <h3 className="group-hover:text-primary mb-1 text-lg font-semibold transition-colors">{hotel.name}</h3>
                  <div className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" />{hotel.province}
                  </div>
                  <p className="text-muted-foreground mb-3 line-clamp-1 text-sm">{hotel.description}</p>
                  <div className="border-border flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-primary text-lg font-bold">{formatPrice(Number(hotel.min_price))}</span>
                      <span className="text-muted-foreground text-xs">/đêm</span>
                    </div>
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
