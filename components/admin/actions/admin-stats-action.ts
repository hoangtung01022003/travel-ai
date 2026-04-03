import { createAdminClient } from '@/lib/supabase/admin'
import { createServerAction } from '@/lib/utils/server-actions'

export const getAdminStats = createServerAction(async () => {
  const supabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: activeTours },
    { count: totalReviews },
    { count: pendingReports },
    { count: totalDestinations },
    { data: recentReviews },
    { data: pendingReportsList },
  ] = await Promise.all([
    // Total users
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),

    // Active tours
    supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Total reviews
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true }),

    // Pending reports
    supabase
      .from('review_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Total destinations
    supabase
      .from('destinations')
      .select('*', { count: 'exact', head: true }),

    // Recent reviews (10 mới nhất)
    supabase
      .from('reviews')
      .select(
        'id, rating, comment, created_at, target_type, target_id, is_visible, profiles(full_name, email)'
      )
      .order('created_at', { ascending: false })
      .limit(10),

    // Pending reports with review detail
    supabase
      .from('review_reports')
      .select(
        'id, reason, created_at, status, reviews(id, comment, rating, target_type), profiles!review_reports_reporter_id_fkey(full_name, email)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    stats: {
      totalUsers: totalUsers ?? 0,
      activeTours: activeTours ?? 0,
      totalReviews: totalReviews ?? 0,
      pendingReports: pendingReports ?? 0,
      totalDestinations: totalDestinations ?? 0,
    },
    recentReviews: recentReviews ?? [],
    pendingReportsList: pendingReportsList ?? [],
  }
})
