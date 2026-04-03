import { MessageSquare, Star, Eye, EyeOff } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo } from '@/lib/utils/common'

const TARGET_TYPE_LABELS: Record<string, string> = {
  destination: 'Điểm đến',
  hotel: 'Khách sạn',
  tour: 'Tour',
}

export default async function AdminReviewsPage() {
  const supabase = createAdminClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải reviews: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Tổng {reviews?.length ?? 0} đánh giá
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Danh sách đánh giá
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(reviews ?? []).map((review) => {
              const profile = review.profiles as
                | { full_name: string | null; email: string | null }
                | null
              return (
                <div
                  key={review.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(profile?.full_name || profile?.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {profile?.full_name || profile?.email || 'Ẩn danh'}
                      </span>
                      <Badge variant="muted">
                        {TARGET_TYPE_LABELS[review.target_type] || review.target_type}
                      </Badge>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? 'fill-warning text-warning'
                                : 'text-border'
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {review.comment || '(Không có nội dung)'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(review.created_at ?? '')}
                    </span>
                    {review.is_visible ? (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <Eye className="h-3.5 w-3.5" /> Hiển thị
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3.5 w-3.5" /> Ẩn
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
