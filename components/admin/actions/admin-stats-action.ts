import { createAdminClient } from '@/lib/supabase/admin'
import { createServerAction } from '@/lib/utils/server-actions'

export const getAdminStats = createServerAction(async () => {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { count: totalUsers },
    { count: activeTours },
    { count: totalReviews },
    { count: pendingReports },
    { count: totalDestinations },
    { count: totalBookings },
    { data: recentReviews },
    { data: pendingReportsList },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tours').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('review_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('destinations').select('*', { count: 'exact', head: true }),
    // Tổng bookings
    db.from('bookings').select('*', { count: 'exact', head: true }),
    // 10 reviews mới nhất — explicit FK để tránh schema cache miss
    db.from('reviews').select(
      'id, rating, comment, created_at, target_type, target_id, is_visible, profiles!reviews_user_id_fkey(full_name, email)'
    ).order('created_at', { ascending: false }).limit(10),
    // Pending reports
    db.from('review_reports').select(
      'id, reason, created_at, status, reviews(id, comment, rating, target_type), profiles!review_reports_reporter_id_fkey(full_name, email)'
    ).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    // Doanh thu từ paid bookings
    db.from('bookings').select('total_price').eq('payment_status', 'paid'),
  ])

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, b: { total_price: number }) => sum + Number(b.total_price), 0
  )

  return {
    stats: {
      totalUsers:        totalUsers         ?? 0,
      activeTours:       activeTours        ?? 0,
      totalReviews:      totalReviews       ?? 0,
      pendingReports:    pendingReports      ?? 0,
      totalDestinations: totalDestinations  ?? 0,
      totalBookings:     totalBookings      ?? 0,
      totalRevenue,
    },
    recentReviews:     recentReviews     ?? [],
    pendingReportsList: pendingReportsList ?? [],
  }
})
