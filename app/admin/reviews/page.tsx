import { createAdminClient } from '@/lib/supabase/admin'
import ReviewsClient from './reviews-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý Reviews — Admin VietTravel',
}

export default async function AdminReviewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

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
      .limit(500),

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

  return (
    <ReviewsClient
      reviews={reviews ?? []}
      reports={pendingReports ?? []}
      visibleCount={totalVisible ?? 0}
      hiddenCount={totalHidden  ?? 0}
    />
  )
}
