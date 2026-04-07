import { createAdminClient } from '@/lib/supabase/admin'
import BookingsClient from './bookings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý Bookings — Admin VietTravel',
}

export default async function AdminBookingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const [{ data: bookings }, { data: revenueData }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, status, payment_status, num_people, travel_date,
        total_price, payment_method, payment_ref, note,
        created_at, updated_at, booking_type,
        item_name, item_price_snapshot,
        tours  ( id, slug ),
        hotels ( id, slug ),
        profiles!bookings_user_id_fkey ( full_name, email, phone )
      `)
      .order('created_at', { ascending: false })
      .limit(500),

    supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid'),
  ])

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, b: { total_price: number }) => sum + Number(b.total_price), 0
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi và quản lý tất cả đơn đặt tour &amp; khách sạn
        </p>
      </div>

      <BookingsClient bookings={bookings ?? []} totalRevenue={totalRevenue} />
    </div>
  )
}
