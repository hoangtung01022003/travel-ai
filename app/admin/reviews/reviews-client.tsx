'use client'

import { useState, useMemo } from 'react'
import {
  MessageSquare, Star, Eye, EyeOff, AlertTriangle,
  CheckCircle, Search, SlidersHorizontal, Hotel, Route, MapPin,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo } from '@/lib/utils/common'
import {
  ReviewVisibilityToggle,
  ReviewDeleteButton,
  ReportActionButtons,
} from './review-actions-client'

// ── Types ─────────────────────────────────────────────────────────────────────

type TargetType = 'tour' | 'hotel' | 'destination'
type VisibilityFilter = 'all' | 'visible' | 'hidden'

interface ReviewProfile {
  full_name: string | null
  email: string | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  target_type: TargetType
  target_id: string
  is_visible: boolean
  user_id: string
  booking_id: string | null
  profiles: ReviewProfile | null
}

interface ReportReview {
  id: string
  comment: string | null
  rating: number
  target_type: string
  is_visible: boolean
}

interface Report {
  id: string
  reason: unknown
  created_at: string
  status: string
  reviews: ReportReview | null
  profiles: ReviewProfile | null
}

interface ReviewsClientProps {
  reviews: Review[]
  reports: Report[]
  visibleCount: number
  hiddenCount: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const TARGET_TYPE_CONFIG: Record<TargetType, { label: string; color: string; emoji: string; Icon: React.ElementType }> = {
  tour:        { label: 'Tour',       color: 'bg-primary/10 text-primary',  emoji: '🗺️', Icon: Route   },
  hotel:       { label: 'Khách sạn', color: 'bg-accent/10 text-accent',    emoji: '🏨', Icon: Hotel   },
  destination: { label: 'Điểm đến',  color: 'bg-success/10 text-success',  emoji: '📍', Icon: MapPin  },
}

// ── Pending Reports Section ────────────────────────────────────────────────────

function PendingReports({ reports }: { reports: Report[] }) {
  if (reports.length === 0) return null
  return (
    <Card className="border-destructive/30">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Báo cáo chờ xử lý ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {reports.map((report) => {
            const reporter = report.profiles
            const review   = report.reviews
            const typeInfo = review ? TARGET_TYPE_CONFIG[review.target_type as TargetType] : null
            return (
              <div key={report.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                  {(reporter?.full_name || reporter?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {reporter?.full_name || reporter?.email || 'Ẩn danh'} báo cáo
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>
                  </div>
                  {!!report.reason && (
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">Lý do:</span> {String(report.reason)}
                    </p>
                  )}
                  {review && (
                    <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        {typeInfo && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.emoji} {typeInfo.label}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                          ))}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {review.comment || '(Không có nội dung)'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {review && <ReportActionButtons reportId={report.id} reviewId={review.id} />}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function ReviewsClient({
  reviews,
  reports,
  visibleCount,
  hiddenCount,
}: ReviewsClientProps) {

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<TargetType | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [visFilter,  setVisFilter]  = useState<VisibilityFilter>('all')
  const [page,       setPage]       = useState(1)

  const resetPage = () => setPage(1)

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const query = search.toLowerCase()
      const matchSearch = !query || [
        r.id,
        r.profiles?.full_name,
        r.profiles?.email,
        r.comment,
      ].some((v) => v?.toLowerCase().includes(query))

      const matchType    = typeFilter === 'all' || r.target_type === typeFilter
      const matchRating  = ratingFilter === 'all' || r.rating === ratingFilter
      const matchVis     =
        visFilter === 'all'     ? true :
        visFilter === 'visible' ? r.is_visible :
        !r.is_visible

      return matchSearch && matchType && matchRating && matchVis
    })
  }, [reviews, search, typeFilter, ratingFilter, visFilter])

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kiểm duyệt và quản lý tất cả đánh giá người dùng
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tổng reviews',  value: reviews.length, icon: MessageSquare, color: 'text-primary',         bg: 'bg-primary/10'     },
          { label: 'Hiển thị',     value: visibleCount,   icon: Eye,           color: 'text-success',          bg: 'bg-success/10'     },
          { label: 'Đang ẩn',      value: hiddenCount,    icon: EyeOff,        color: 'text-muted-foreground', bg: 'bg-muted'          },
          { label: 'Chờ xử lý',    value: reports.length, icon: AlertTriangle, color: 'text-destructive',      bg: 'bg-destructive/10' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl p-2.5 ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending Reports */}
      <PendingReports reports={reports} />

      {/* All Reviews */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Tất cả đánh giá
              <Badge variant="outline" className="ml-1 text-xs">
                {filtered.length}{filtered.length !== reviews.length && `/${reviews.length}`}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-success" /> {visibleCount} hiển thị
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" /> {hiddenCount} ẩn
              </span>
            </div>
          </div>
        </CardHeader>

        {/* ── Filters ── */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, nội dung..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage() }}
                className="w-full rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Type filter — Tour / KS / Điểm đến */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {(['all', 'tour', 'hotel', 'destination'] as const).map((t) => {
                const cfg = t !== 'all' ? TARGET_TYPE_CONFIG[t] : null
                return (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); resetPage() }}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {t === 'all' ? (
                      'Tất cả'
                    ) : (
                      <>{cfg?.emoji} {cfg?.label}</>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Rating filter */}
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRatingFilter(r); resetPage() }}
                  className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                    ratingFilter === r
                      ? 'bg-warning text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {r === 'all' ? 'Tất cả ★' : `${r}★`}
                </button>
              ))}
            </div>

            {/* Visibility filter */}
            <div className="flex items-center gap-1">
              {(['all', 'visible', 'hidden'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setVisFilter(v); resetPage() }}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    visFilter === v
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {v === 'all'     && 'Tất cả'}
                  {v === 'visible' && <><Eye     className="h-3 w-3" /> Hiển thị</>}
                  {v === 'hidden'  && <><EyeOff  className="h-3 w-3" /> Đang ẩn</>}
                </button>
              ))}
            </div>

          </div>
        </div>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {reviews.length === 0 ? 'Chưa có đánh giá nào' : 'Không có đánh giá khớp điều kiện lọc'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Người dùng</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Loại</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-56">Nội dung</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageData.map((review) => {
                    const profile  = review.profiles
                    const typeInfo = TARGET_TYPE_CONFIG[review.target_type]
                    const TypeIcon = typeInfo?.Icon

                    return (
                      <tr
                        key={review.id}
                        className={`transition-colors hover:bg-muted/30 ${!review.is_visible ? 'opacity-50' : ''}`}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px] text-xs">
                              {profile?.full_name || profile?.email || (
                                <span className="text-muted-foreground">Ẩn danh</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          {typeInfo ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                              {TypeIcon && <TypeIcon className="h-3 w-3" />}
                              {typeInfo.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">{review.target_type}</span>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                            ))}
                            <span className="ml-1 text-xs font-medium">{review.rating}</span>
                          </div>
                        </td>

                        {/* Comment */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {review.comment || <span className="italic">(Không có nội dung)</span>}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {timeAgo(review.created_at)}
                        </td>

                        {/* Visibility */}
                        <td className="px-4 py-3 text-center">
                          {review.is_visible ? (
                            <span className="flex items-center justify-center gap-1 text-xs text-success">
                              <Eye className="h-3.5 w-3.5" /> Hiển thị
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <EyeOff className="h-3.5 w-3.5" /> Ẩn
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ReviewVisibilityToggle reviewId={review.id} isVisible={review.is_visible} />
                            <ReviewDeleteButton reviewId={review.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Trang {page}/{totalPages} · {filtered.length} kết quả
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm" variant="outline" className="h-7 w-7 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2
                  if (p < 1 || p > totalPages) return null
                  return (
                    <Button
                      key={p} size="sm"
                      variant={p === page ? 'default' : 'outline'}
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  size="sm" variant="outline" className="h-7 w-7 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
