'use client'

import { useState, useMemo } from 'react'
import {
  Receipt, Users, CheckCircle2, XCircle, CreditCard,
  CalendarDays, Hotel, Route, Search, SlidersHorizontal,
  Eye, X, Star, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, timeAgo } from '@/lib/utils/common'
import { BookingStatusAction } from './booking-actions-client'

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus  = 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'completed'
type PaymentStatus  = 'unpaid' | 'paid' | 'refunded'

interface Booking {
  id: string
  status: BookingStatus
  payment_status: PaymentStatus
  num_people: number
  travel_date: string
  total_price: number
  payment_method: string
  payment_ref: string | null
  note: string | null
  created_at: string
  updated_at: string
  booking_type: 'tour' | 'hotel'
  // ── Snapshot tại thời điểm đặt ─────────────────────────────
  item_name: string | null
  item_price_snapshot: number | null
  // ── Relations (chỉ dùng cho navigation link) ─────────────
  tours:    { id: string; slug: string } | null
  hotels:   { id: string; slug: string } | null
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
}

interface BookingsClientProps {
  bookings:     Booking[]
  totalRevenue: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' | 'muted'; dot: string }> = {
  pending:   { label: 'Chờ TT',     variant: 'warning',     dot: 'bg-amber-400' },
  confirmed: { label: 'Xác nhận',   variant: 'success',     dot: 'bg-emerald-500' },
  completed: { label: 'Hoàn thành', variant: 'default',     dot: 'bg-blue-500' },
  cancelled: { label: 'Đã hủy',     variant: 'destructive', dot: 'bg-red-500' },
  refunded:  { label: 'Hoàn tiền',  variant: 'muted',       dot: 'bg-gray-400' },
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid:   { label: 'Chưa TT',   color: 'text-amber-600' },
  paid:     { label: 'Đã TT',     color: 'text-emerald-600' },
  refunded: { label: 'Hoàn tiền', color: 'text-muted-foreground' },
}

const PAGE_SIZE = 20

// ── Booking Detail Dialog ─────────────────────────────────────────────────────

function BookingDetailDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const isHotel = booking.booking_type === 'hotel'
  const user    = booking.profiles
  // Dùng snapshot tên — không bị ảnh hưởng khi admin update tour/hotel
  const itemDisplayName = booking.item_name ?? (isHotel ? 'Khách sạn' : 'Tour')
  const status  = BOOKING_STATUS_CONFIG[booking.status]
  const payment = PAYMENT_CONFIG[booking.payment_status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isHotel ? 'bg-accent/10' : 'bg-primary/10'}`}>
              {isHotel ? <Hotel className="h-4 w-4 text-accent" /> : <Route className="h-4 w-4 text-primary" />}
            </div>
            <div>
              <p className="font-semibold">{itemDisplayName}</p>
              <p className="text-xs text-muted-foreground">
                #{booking.id.slice(0, 8).toUpperCase()} · {isHotel ? 'Khách sạn' : 'Tour'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={status.variant as 'default'} className="gap-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </Badge>
            <span className={`text-sm font-medium flex items-center gap-1 ${payment.color}`}>
              <CreditCard className="h-3.5 w-3.5" /> {payment.label}
              {booking.payment_method && ` · ${booking.payment_method.toUpperCase()}`}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Khách hàng</p>
              <p className="font-medium">{user?.full_name || user?.email || 'Ẩn danh'}</p>
              {user?.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
              {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Ngày đặt</p>
              <p className="font-medium">{new Date(booking.created_at).toLocaleDateString('vi-VN')}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(booking.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Ngày đi</p>
              <p className="font-medium">{new Date(booking.travel_date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{isHotel ? 'Số đêm' : 'Số người'}</p>
              <p className="font-medium">{booking.num_people} {isHotel ? 'đêm' : 'người'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Tổng tiền</p>
              <p className="text-lg font-bold text-primary">{formatPrice(booking.total_price)}</p>
            </div>
            {booking.payment_ref && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Mã GD VNPay</p>
                <p className="font-mono text-xs">{booking.payment_ref}</p>
              </div>
            )}
          </div>

          {/* Note */}
          {booking.note && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Thông tin liên hệ & Ghi chú</p>
              <p className="text-sm whitespace-pre-wrap">{booking.note}</p>
            </div>
          )}

          {/* Change status */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Đổi trạng thái:</p>
            <BookingStatusAction bookingId={booking.id} currentStatus={booking.status} paymentStatus={booking.payment_status} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function BookingsClient({ bookings, totalRevenue }: BookingsClientProps) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'tour' | 'hotel'>('all')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState<Booking | null>(null)

  // Stats
  const pending   = bookings.filter((b) => b.status === 'pending').length
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length
  const completed = bookings.filter((b) => b.status === 'completed').length

  // Filter + search
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const query = search.toLowerCase()
      const matchSearch = !query || [
        b.id,
        b.profiles?.full_name,
        b.profiles?.email,
        b.profiles?.phone,
        // Dùng snapshot name — tìm kiếm vấn đúng dù tour/hotel đã bị đổi tên
        b.item_name,
      ].some((v) => v?.toLowerCase().includes(query))

      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      const matchType   = typeFilter   === 'all' || b.booking_type === typeFilter

      return matchSearch && matchStatus && matchType
    })
  }, [bookings, search, statusFilter, typeFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage  = () => setPage(1)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tổng booking',   value: bookings.length, color: 'text-primary',       bg: 'bg-primary/10',     icon: Receipt },
          { label: 'Chờ thanh toán', value: pending,         color: 'text-amber-600',     bg: 'bg-amber-50',       icon: CalendarDays },
          { label: 'Đã xác nhận',   value: confirmed,       color: 'text-success',        bg: 'bg-success/10',     icon: CheckCircle2 },
          { label: 'Doanh thu',      value: formatPrice(totalRevenue), color: 'text-accent', bg: 'bg-accent/10', icon: Star, isText: true },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-border bg-white p-5 flex items-center gap-4">
              <div className={`rounded-xl p-2.5 ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold truncate ${s.isText ? 'text-base' : 'text-2xl'}`}>{String(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, tour..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); resetPage() }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {s === 'all' ? 'Tất cả' : BOOKING_STATUS_CONFIG[s as BookingStatus]?.label ?? s}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'tour', 'hotel'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); resetPage() }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {t === 'all' ? 'Tour + KS' : t === 'tour' ? '🗺️ Tour' : '🏨 Khách sạn'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-medium">
            {filtered.length} bookings
            {filtered.length !== bookings.length && ` (đã lọc từ ${bookings.length})`}
          </p>
          <p className="text-xs text-muted-foreground">
            Hoàn thành: {completed}
          </p>
        </div>

        {pageData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Không có booking nào khớp điều kiện lọc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">#ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Loại / Tên</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Ngày đi</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SL</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Số tiền</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Thanh toán</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((booking) => {
                  const isHotel = booking.booking_type === 'hotel'
                  const item    = isHotel ? booking.hotels : booking.tours
                  const user    = booking.profiles
                  const status  = BOOKING_STATUS_CONFIG[booking.status]
                  const payment = PAYMENT_CONFIG[booking.payment_status]
                  return (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelected(booking)}
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isHotel ? 'bg-accent/10' : 'bg-primary/10'}`}>
                            {isHotel ? <Hotel className="h-3.5 w-3.5 text-accent" /> : <Route className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Item name — dùng snapshot */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate font-medium text-xs">
                          {booking.item_name ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">{isHotel ? 'Khách sạn' : 'Tour'}</p>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="truncate text-xs font-medium">{user?.full_name || user?.email || 'Ẩn danh'}</p>
                        {user?.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(booking.travel_date).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Count */}
                      <td className="px-4 py-3 text-xs text-center">
                        {booking.num_people}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-primary">{formatPrice(booking.total_price)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={status.variant as 'default'} className="gap-1 text-xs whitespace-nowrap">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </Badge>
                      </td>

                      {/* Payment */}
                      <td className={`px-4 py-3 text-xs font-medium ${payment.color}`}>
                        {payment.label}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Xem chi tiết"
                            onClick={(e) => { e.stopPropagation(); setSelected(booking) }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <BookingStatusAction bookingId={booking.id} currentStatus={booking.status} paymentStatus={booking.payment_status} />
                          </div>
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
      </div>

      {/* Detail Dialog */}
      {selected && (
        <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
