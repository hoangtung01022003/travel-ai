import { getAdminStats } from '@/components/admin/actions/admin-stats-action'
import {
  Users, Route, MessageSquare, AlertTriangle, MapPin, Star,
  TrendingUp, Eye, EyeOff, Receipt, DollarSign,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo, formatPrice } from '@/lib/utils/common'
import Link from 'next/link'

const TARGET_TYPE_LABELS: Record<string, string> = {
  destination: 'Điểm đến',
  hotel: 'Khách sạn',
  tour: 'Tour',
}

export default async function AdminDashboardPage() {
  const result = await getAdminStats()

  if (!result.success) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Không thể tải dữ liệu: {result.error}</p>
      </div>
    )
  }

  const { stats, recentReviews, pendingReportsList } = result.data

  const statCards = [
    {
      label: 'Doanh thu',
      value: formatPrice(stats.totalRevenue),
      isText: true,
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success/10',
      href: '/admin/bookings',
      trend: 'Từ bookings đã TT',
    },
    {
      label: 'Người dùng',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      href: '/admin/users',
      trend: 'Tài khoản đã đăng ký',
    },
    {
      label: 'Tours hoạt động',
      value: stats.activeTours,
      icon: Route,
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: '/admin/tours',
      trend: 'is_active = true',
    },
    {
      label: 'Tổng Bookings',
      value: stats.totalBookings,
      icon: Receipt,
      color: 'text-accent',
      bg: 'bg-accent/10',
      href: '/admin/bookings',
      trend: 'Tất cả đơn đặt chỗ',
    },
    {
      label: 'Đánh giá',
      value: stats.totalReviews,
      icon: MessageSquare,
      color: 'text-warning',
      bg: 'bg-warning/10',
      href: '/admin/reviews',
      trend: 'Reviews từ users',
    },
    {
      label: 'Báo cáo chờ',
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      href: '/admin/reviews',
      trend: 'Cần xử lý ngay',
    },

  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chào mừng trở lại! Đây là tổng quan hoạt động của VietTravel.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <Card className="border-border transition-all hover:border-primary/30 hover:shadow-md cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{card.label}</p>
                      <p className={`mt-1 font-bold ${card.isText ? 'text-base' : 'text-2xl'} truncate`}>
                        {String(card.value)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground truncate">{card.trend}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 shrink-0 ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Reviews — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-accent" />
                Đánh giá gần đây
              </CardTitle>
              <Link href="/admin/reviews">
                <Badge variant="muted" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                  {recentReviews.length} mới nhất →
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentReviews.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Chưa có đánh giá nào
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReviews.map((review: Record<string, unknown>) => {
                  const profile = review.profiles as { full_name: string | null; email: string | null } | null
                  return (
                    <div
                      key={review.id as string}
                      className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {profile?.full_name || profile?.email || 'Ẩn danh'}
                          </span>
                          <Badge variant="muted" className="text-xs">
                            {TARGET_TYPE_LABELS[review.target_type as string] || review.target_type as string}
                          </Badge>
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < (review.rating as number) ? 'fill-warning text-warning' : 'text-border'}`} />
                            ))}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {(review.comment as string) || '(Không có nội dung)'}
                        </p>
                      </div>
                      <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">{timeAgo(review.created_at as string)}</span>
                        {review.is_visible ? (
                          <Eye className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reports — 1/3 */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Chờ kiểm duyệt
              </CardTitle>
              {stats.pendingReports > 0 && (
                <Badge variant="destructive">{stats.pendingReports}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingReportsList.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-success" />
                <p className="text-sm text-muted-foreground">Không có báo cáo nào chờ duyệt</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingReportsList.map((report: Record<string, unknown>) => {
                  const reporter = report.profiles as { full_name: string | null; email: string | null } | null
                  const review = report.reviews as { id: string; comment: string | null; rating: number; target_type: string } | null
                  return (
                    <div key={report.id as string} className="px-5 py-4">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-destructive">
                          {reporter?.full_name || reporter?.email || 'Ẩn danh'}
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(report.created_at as string)}</span>
                      </div>
                      {!!report.reason && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Lý do:</span> {String(report.reason)}
                        </p>
                      )}
                      {review && (
                        <div className="rounded-lg bg-muted/60 p-2.5 text-xs">
                          <div className="mb-1 flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {TARGET_TYPE_LABELS[review.target_type] || review.target_type}
                            </Badge>
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-warning text-warning" />{review.rating}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-muted-foreground">
                            {review.comment || '(Không có nội dung)'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Quản lý nhanh</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { href: '/admin/users', label: 'Users', icon: Users, color: 'bg-secondary/10 text-secondary' },
              { href: '/admin/tours', label: 'Tours', icon: Route, color: 'bg-primary/10 text-primary' },
              { href: '/admin/hotels', label: 'Khách sạn', icon: MessageSquare, color: 'bg-accent/10 text-accent' },
              { href: '/admin/destinations', label: 'Điểm đến', icon: MapPin, color: 'bg-success/10 text-success' },
              { href: '/admin/bookings', label: 'Bookings', icon: Receipt, color: 'bg-orange-50 text-orange-600' },
              { href: '/admin/reviews', label: 'Reviews', icon: Star, color: 'bg-warning/10 text-warning' },
              { href: '/admin/ai-logs', label: 'AI Logs', icon: TrendingUp, color: 'bg-muted text-muted-foreground' },
            ].map((item) => {
              const Icon = item.icon
              const [bg, tc] = item.color.split(' ')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className={`rounded-lg p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${tc}`} />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
