import { MessageSquare, Star, Eye, EyeOff, AlertTriangle, CheckCircle, Filter } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo } from '@/lib/utils/common'
import {
  ReviewVisibilityToggle,
  ReviewDeleteButton,
  ReportActionButtons,
} from './review-actions-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý Reviews — Admin VietTravel',
}

const TARGET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  destination: { label: 'Điểm đến', color: 'bg-success/10 text-success' },
  hotel:       { label: 'Khách sạn', color: 'bg-accent/10 text-accent' },
  tour:        { label: 'Tour',       color: 'bg-primary/10 text-primary' },
}

export default async function AdminReviewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // FIX: Dùng explicit FK hint "profiles!reviews_user_id_fkey" thay vì implicit join
  // để tránh Supabase schema cache miss silently trả về null cho profiles
  const [
    { data: reviews, error: reviewsError },
    { data: pendingReports },
    { count: totalVisible },
    { count: totalHidden },
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at, target_type, target_id,
        is_visible, user_id, booking_id,
        profiles!reviews_user_id_fkey ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(200),

    supabase
      .from('review_reports')
      .select(`
        id, reason, created_at, status,
        reviews ( id, comment, rating, target_type, is_visible ),
        profiles!review_reports_reporter_id_fkey ( full_name, email )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),

    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('is_visible', true),

    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('is_visible', false),
  ])

  if (reviewsError) {
    console.error('[admin/reviews] query error:', reviewsError)
  }

  const allReviews = (reviews ?? []) as Record<string, unknown>[]
  const reports    = (pendingReports ?? []) as Record<string, unknown>[]
  const visibleCount = totalVisible ?? 0
  const hiddenCount  = totalHidden  ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm duyệt và quản lý tất cả đánh giá người dùng
          </p>
        </div>
      </div>

      {/* Debug error (only in dev) */}
      {reviewsError && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          ⚠️ Query error: {reviewsError.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tổng reviews',   value: allReviews.length, icon: MessageSquare, color: 'text-primary',     bg: 'bg-primary/10' },
          { label: 'Hiển thị',      value: visibleCount,      icon: Eye,           color: 'text-success',     bg: 'bg-success/10' },
          { label: 'Đang ẩn',       value: hiddenCount,       icon: EyeOff,        color: 'text-muted-foreground', bg: 'bg-muted' },
          { label: 'Chờ xử lý',     value: reports.length,   icon: AlertTriangle, color: 'text-destructive',  bg: 'bg-destructive/10' },
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
      {reports.length > 0 && (
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
                const reporter = report.profiles as { full_name: string | null; email: string | null } | null
                const review   = report.reviews  as { id: string; comment: string | null; rating: number; target_type: string; is_visible: boolean } | null
                const typeInfo = TARGET_TYPE_LABELS[review?.target_type ?? '']
                return (
                  <div key={report.id as string} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                      {(reporter?.full_name || reporter?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {reporter?.full_name || reporter?.email || 'Ẩn danh'} báo cáo
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(report.created_at as string)}</span>
                      </div>
                      {report.reason && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">Lý do:</span> {report.reason as string}
                        </p>
                      )}
                      {review && (
                        <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            {typeInfo && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
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
                      {review && <ReportActionButtons reportId={report.id as string} reviewId={review.id} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reviews — TABLE layout */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Tất cả đánh giá ({allReviews.length})
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
        <CardContent className="p-0">
          {allReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Chưa có đánh giá nào</p>
              {reviewsError && (
                <p className="text-xs text-destructive">Lỗi: {reviewsError.message}</p>
              )}
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
                  {allReviews.map((review) => {
                    const profile  = review.profiles as { full_name: string | null; email: string | null } | null
                    const typeInfo = TARGET_TYPE_LABELS[review.target_type as string]
                    const isVisible = review.is_visible as boolean
                    const rating    = review.rating as number

                    return (
                      <tr
                        key={review.id as string}
                        className={`transition-colors hover:bg-muted/30 ${!isVisible ? 'opacity-50' : ''}`}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px] text-xs">
                              {profile?.full_name || profile?.email || <span className="text-muted-foreground">Ẩn danh</span>}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          {typeInfo ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">{review.target_type as string}</span>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-border'}`} />
                            ))}
                            <span className="ml-1 text-xs font-medium">{rating}</span>
                          </div>
                        </td>

                        {/* Comment */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {(review.comment as string) || <span className="italic">(Không có nội dung)</span>}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {timeAgo(review.created_at as string)}
                        </td>

                        {/* Visibility */}
                        <td className="px-4 py-3 text-center">
                          {isVisible ? (
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
                            <ReviewVisibilityToggle reviewId={review.id as string} isVisible={isVisible} />
                            <ReviewDeleteButton reviewId={review.id as string} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
