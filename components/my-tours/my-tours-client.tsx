'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Calendar, Users, Clock, ChevronDown,
  CreditCard, CheckCircle2, XCircle, AlertCircle,
  Loader2, ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TourSnap {
  id: string
  name: string
  slug: string
  cover_image: string | null
  duration_days: number
  price: number
}

interface Booking {
  id: string
  status: string
  payment_status: string
  num_people: number
  travel_date: string
  total_price: number
  payment_method: string
  note: string | null
  created_at: string
  tours: TourSnap | null
}

interface MyToursClientProps {
  bookings: Booking[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

const BOOKING_STATUS: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  pending:   { label: 'Chờ thanh toán',  variant: 'warning' },
  confirmed: { label: 'Đã xác nhận',     variant: 'success' },
  cancelled: { label: 'Đã hủy',          variant: 'destructive' },
  refunded:  { label: 'Đã hoàn tiền',    variant: 'default' },
}

const PAYMENT_ICON: Record<string, React.ReactNode> = {
  paid:    <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  unpaid:  <AlertCircle  className="h-4 w-4 text-amber-500" />,
  refunded:<XCircle      className="h-4 w-4 text-muted-foreground" />,
}

// ── Single booking card ───────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false)
  const tour = booking.tours
  const status = BOOKING_STATUS[booking.status] ?? { label: booking.status, variant: 'default' }

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      {/* Main row */}
      <div className="flex gap-0 sm:gap-4">
        {/* Cover image */}
        {tour?.cover_image && (
          <div className="relative hidden sm:block w-40 shrink-0">
            <Image
              src={tour.cover_image}
              alt={tour.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {tour ? (
                <Link
                  href={`/tours/${tour.slug}`}
                  className="font-semibold hover:text-primary transition-colors line-clamp-2"
                >
                  {tour.name}
                </Link>
              ) : (
                <p className="font-semibold text-muted-foreground">Tour không tồn tại</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                Đặt ngày {fmtDate(booking.created_at)}
              </p>
            </div>
            <Badge variant={status.variant as 'default'}>{status.label}</Badge>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {fmtDate(booking.travel_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {booking.num_people} người
            </span>
            {tour?.duration_days && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {tour.duration_days} ngày
              </span>
            )}
            <span className="flex items-center gap-1.5">
              {PAYMENT_ICON[booking.payment_status]}
              {booking.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>

          {/* Price + expand */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Tổng tiền</p>
              <p className="text-lg font-bold text-primary">{fmtVND(booking.total_price)}</p>
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Chi tiết
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Mã đặt chỗ</p>
                <p className="font-mono text-xs font-medium">{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phương thức TT</p>
                <p className="flex items-center gap-1 font-medium uppercase">
                  <CreditCard className="h-3.5 w-3.5" /> {booking.payment_method}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Giá/người</p>
                <p className="font-medium">{tour ? fmtVND(Number(tour.price)) : '—'}</p>
              </div>
              {booking.note && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-muted-foreground">Thông tin liên hệ &amp; Ghi chú</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs">{booking.note}</p>
                </div>
              )}
            </div>

            {/* Re-pay if unpaid */}
            {booking.payment_status === 'unpaid' && booking.status === 'pending' && (
              <div className="flex items-center gap-3 border-t border-border px-5 py-3">
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Booking chưa được thanh toán
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/api/payment/retry?id=${booking.id}`}>
                    Thanh toán lại
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export default function MyToursClient({ bookings }: MyToursClientProps) {
  const confirmed  = bookings.filter((b) => b.status === 'confirmed')
  const pending    = bookings.filter((b) => b.status === 'pending')
  const cancelled  = bookings.filter((b) => ['cancelled', 'refunded'].includes(b.status))

  type Tab = 'all' | 'confirmed' | 'pending' | 'cancelled'
  const [tab, setTab] = useState<Tab>('all')

  const displayed: Booking[] =
    tab === 'all'       ? bookings  :
    tab === 'confirmed' ? confirmed :
    tab === 'pending'   ? pending   : cancelled

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',       label: 'Tất cả',        count: bookings.length },
    { key: 'confirmed', label: 'Đã xác nhận',   count: confirmed.length },
    { key: 'pending',   label: 'Chờ thanh toán', count: pending.length },
    { key: 'cancelled', label: 'Đã hủy',         count: cancelled.length },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Đặt chỗ của tôi</h1>
        <p className="text-muted-foreground text-sm">
          Quản lý tất cả tour và khách sạn bạn đã đặt
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center"
        >
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium">Chưa có đặt chỗ nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Hãy khám phá và đặt tour ngay!</p>
          </div>
          <Button asChild>
            <Link href="/tours">Xem các tour</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {displayed.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BookingCard booking={b} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
