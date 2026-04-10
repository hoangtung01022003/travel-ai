'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CalendarDays, Users, CreditCard, Loader2,
  AlertCircle, Phone, Mail, User, MessageSquare, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getFullProfile } from '@/components/layout/actions/user-info-action'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingModalProps {
  open: boolean
  onClose: () => void
  type: 'tour' | 'hotel'
  itemId: string
  itemName: string
  pricePerUnit: number  // VND per person (tour) or per night (hotel)
  priceLabel: string    // '/người' | '/đêm'
  startDates?: string[]
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

import { createBookingAction } from './actions/booking-actions'

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingModal({
  open, onClose, type, itemId, itemName, pricePerUnit, priceLabel, startDates = [],
}: BookingModalProps) {
  const router = useRouter()

  const [people, setPeople] = useState(2)
  const [date, setDate] = useState(startDates[0] ?? '')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // paymentUrl state: khi có link thanh toán, nếu redirect tự động thất bại sẽ hiện nút bấm dự phòng
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const redirectAttempted = useRef(false)

  const totalPrice = pricePerUnit * people

  // Reset on close
  useEffect(() => {
    if (!open) {
      setError('')
      setPaymentUrl(null)
      redirectAttempted.current = false
    }
  }, [open])

  // Pre-fill từ profile khi mở modal
  useEffect(() => {
    if (!open) return
    async function prefill() {
      try {
        const result = await getFullProfile()
        if (result.success && result.data) {
          const profile = result.data
          if (profile.full_name && !name) setName(profile.full_name)
          if (profile.phone && !phone) setPhone(profile.phone)
          if (profile.email && !email) setEmail(profile.email)
        }
      } catch (err) {
        console.error('[BookingModal] Failed to prefill profile:', err)
      }
    }
    prefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ── Redirect helper với fallback ─────────────────────────────────────────────
  const redirectToVNPay = (url: string) => {
    setPaymentUrl(url)
    redirectAttempted.current = true

    // Chuyển hướng ngay lập tức
    try {
      window.location.assign(url)
    } catch {
      console.warn('[Booking] window.location.assign blocked, showing fallback button')
    }
  }

  // ── Main booking handler (CHUYỂN SANG DÙNG SERVER ACTION) ─────────────────────
  const handleBook = async () => {
    setError('')
    setPaymentUrl(null)
    
    if (!date) { setError('Vui lòng chọn ngày'); return }
    if (!phone && !email) { setError('Vui lòng nhập số điện thoại hoặc email liên hệ'); return }

    setLoading(true)

    try {
      // ✅ CHIẾN THUẬT: Gọi 1 Action duy nhất xử lý cả Insert và tạo Link Thanh toán
      const result = await createBookingAction({
        itemId,
        itemName,
        type,
        people,
        date,
        pricePerUnit,
        totalPrice,
        contactInfo: {
          name,
          phone,
          email,
          note
        }
      })

      if (!result.success) {
        setError(result.error || 'Đã có lỗi xảy ra khi tạo đặt chỗ.')
        setLoading(false)
        return
      }

      // Nếu có link thanh toán từ server trả về, tiến hành chuyển hướng
      if (result.paymentUrl) {
        redirectToVNPay(result.paymentUrl)
      } else {
        setError('Không nhận được link thanh toán từ hệ thống.')
        setLoading(false)
      }

    } catch (err: any) {
      console.error('[Booking] unexpected error:', err)
      setError(`Lỗi kết nối: ${err.message || 'Vui lòng thử lại sau.'}`)
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal — fixed centered */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold">
                    {type === 'tour' ? '🗺️ Đặt tour' : '🏨 Đặt phòng khách sạn'}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{itemName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">

                {/* ── Contact fields ── */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Thông tin liên hệ
                  </p>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-primary" /> Họ tên người đặt
                    </Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-primary" /> Số điện thoại
                      </Label>
                      <Input
                        type="tel"
                        placeholder="0901 234 567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5 text-primary" /> Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Trip info ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Thông tin chuyến đi
                  </p>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {type === 'tour' ? 'Ngày khởi hành' : 'Ngày nhận phòng'}
                    </Label>
                    {startDates.length > 0 ? (
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      >
                        <option value="">-- Chọn ngày --</option>
                        {startDates.map((d) => (
                          <option key={d} value={d}>
                            {new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    )}
                  </div>

                  {/* People / nights counter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Số {type === 'tour' ? 'người' : 'đêm'}
                    </Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPeople((p) => Math.max(1, p - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xl font-bold hover:bg-muted transition-colors"
                      >−</button>
                      <span className="w-8 text-center text-lg font-semibold">{people}</span>
                      <button
                        type="button"
                        onClick={() => setPeople((p) => Math.min(20, p + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xl font-bold hover:bg-muted transition-colors"
                      >+</button>
                      <span className="text-sm text-muted-foreground">
                        × {fmtVND(pricePerUnit)} {priceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> Ghi chú (tuỳ chọn)
                    </Label>
                    <textarea
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={2}
                      placeholder="Yêu cầu đặc biệt, phòng tầng cao, ăn chay..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{people} {type === 'tour' ? 'người' : 'đêm'} × {fmtVND(pricePerUnit)}</p>
                    <p className="text-sm font-medium">Tổng thanh toán</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{fmtVND(totalPrice)}</span>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Fallback redirect button (shown if window.location.assign was blocked) */}
                {paymentUrl && (
                  <a
                    href={paymentUrl}
                    target="_self"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Nhấn đây để tiếp tục thanh toán VNPay
                  </a>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-4">
                <Button
                  className="w-full gap-2" size="lg"
                  onClick={handleBook}
                  disabled={loading || !!paymentUrl}
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
                    : <><CreditCard className="h-4 w-4" /> Xác nhận &amp; Thanh toán VNPay</>
                  }
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  🔒 Thanh toán an toàn qua cổng VNPay
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
