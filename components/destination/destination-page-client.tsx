'use client'

import type { Destination } from '@/types/destination'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Star, SlidersHorizontal, X, ChevronDown, ChevronUp, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DESTINATION_TYPES } from '@/lib/constants/common'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/common'
import { SearchInput } from '../common/search-input'
import { useRouter, useSearchParams } from 'next/navigation'

interface DestinationProps {
  destinations: Destination[]
  totalCount: number
}

const REGIONS = [
  { value: 'Bắc', label: '🏔️ Miền Bắc' },
  { value: 'Trung', label: '🌊 Miền Trung' },
  { value: 'Nam', label: '🌴 Miền Nam' },
]

const PRICE_RANGES = [
  { label: 'Dưới 500K', min: 0, max: 500000 },
  { label: '500K – 1.5M', min: 500000, max: 1500000 },
  { label: '1.5M – 5M', min: 1500000, max: 5000000 },
  { label: 'Trên 5M', min: 5000000, max: 0 },
]

const RATING_OPTIONS = [
  { value: '4.5', label: '4.5+ ⭐' },
  { value: '4', label: '4.0+ ⭐' },
  { value: '3.5', label: '3.5+ ⭐' },
]

// Reusable filter pill button
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
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

export const DestinationPageClient = ({ destinations, totalCount }: DestinationProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Read current filters from URL
  const keyword       = searchParams.get('keyword') || ''
  const selectedType  = searchParams.get('type') || ''
  const selectedRegion = searchParams.get('region') || ''
  const minPrice      = searchParams.get('minPrice') || ''
  const maxPrice      = searchParams.get('maxPrice') || ''
  const minRating     = searchParams.get('minRating') || ''

  const activeFilterCount = [selectedType, selectedRegion, minPrice || maxPrice, minRating]
    .filter(Boolean).length

  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key)
      else params.set(key, val)
    })
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const clearAllFilters = () => router.push('/destinations')

  const currentPriceLabel = PRICE_RANGES.find(
    r => String(r.min) === minPrice && String(r.max) === maxPrice
  )?.label ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
          Khám phá <span className="text-gradient">điểm đến</span>
        </h1>
        <p className="text-muted-foreground">
          Tìm kiếm và khám phá những địa điểm du lịch tuyệt vời tại Việt Nam
        </p>
      </div>

      {/* Filter Panel */}
      <div className="border-border mb-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
        {/* Search + toggle */}
        <div className="flex gap-3 p-4">
          <SearchInput
            className="flex-1"
            placeholder="Tìm theo tên, tỉnh thành..."
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

        {/* Destination type — always visible */}
        <div className="flex flex-wrap gap-2 border-t border-border/50 px-4 py-3">
          <FilterPill
            active={!selectedType}
            onClick={() => pushParams({ type: null })}
          >
            Tất cả
          </FilterPill>
          {DESTINATION_TYPES.map(type => (
            <FilterPill
              key={type.value}
              active={selectedType === type.value}
              onClick={() => pushParams({ type: selectedType === type.value ? null : type.value })}
            >
              {type.icon} {type.label}
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
                {/* Region */}
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Vùng miền
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill active={!selectedRegion} onClick={() => pushParams({ region: null })}>
                      Tất cả
                    </FilterPill>
                    {REGIONS.map(r => (
                      <FilterPill
                        key={r.value}
                        active={selectedRegion === r.value}
                        onClick={() => pushParams({ region: selectedRegion === r.value ? null : r.value })}
                      >
                        {r.label}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    💰 Khoảng giá
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

        {/* Active filters bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 border-t border-border/50 bg-muted/30 px-4 py-2.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {activeFilterCount} bộ lọc đang áp dụng
            </span>
            <button
              onClick={clearAllFilters}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Xóa tất cả
            </button>
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{totalCount} điểm đến được tìm thấy</p>

      {destinations.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {destinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link href={`/destinations/${dest.slug}`}>
                <div className="group border-border card-hover overflow-hidden rounded-2xl border bg-white">
                  <div className="relative h-52 overflow-hidden">
                    {dest.cover_image ? (
                      <Image
                        src={dest.cover_image}
                        alt={dest.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <MapPin className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="accent" className="backdrop-blur-sm">
                        {DESTINATION_TYPES.find(t => t.value === dest.destination_type)?.icon}{' '}
                        {DESTINATION_TYPES.find(t => t.value === dest.destination_type)?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
                      <MapPin className="h-3.5 w-3.5" />{dest.province}
                    </div>
                    <h3 className="group-hover:text-primary mb-1 text-lg font-semibold transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{dest.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="fill-warning text-warning h-4 w-4" />
                        <span className="text-sm font-semibold">{Number(dest.avg_rating).toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">({dest.review_count})</span>
                      </div>
                      <span className="text-primary text-sm font-medium">
                        Từ {formatPrice(dest.min_price ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="py-16 text-center">
          <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">Không tìm thấy kết quả</h3>
          <p className="text-muted-foreground mb-4">Thử thay đổi từ khóa hoặc bộ lọc khác</p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearAllFilters} className="gap-2">
              <X className="h-4 w-4" /> Xóa bộ lọc
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
