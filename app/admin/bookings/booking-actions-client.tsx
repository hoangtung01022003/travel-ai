'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateBookingStatus } from './actions'
import { toast } from 'sonner'

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'completed'

const STATUS_CONFIG: Record<BookingStatus, { label: string; nextActions: BookingStatus[] }> = {
  pending:   { label: 'Chờ thanh toán', nextActions: ['confirmed', 'cancelled'] },
  confirmed: { label: 'Đã xác nhận',   nextActions: ['completed', 'cancelled', 'refunded'] },
  completed: { label: 'Hoàn thành',    nextActions: ['refunded'] },
  cancelled: { label: 'Đã hủy',        nextActions: [] },
  refunded:  { label: 'Đã hoàn tiền',  nextActions: [] },
}

const ACTION_LABELS: Record<BookingStatus, { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: React.ElementType }> = {
  confirmed:  { label: 'Xác nhận',        variant: 'default',      icon: CheckCircle2 },
  completed:  { label: 'Hoàn thành',      variant: 'secondary',    icon: CheckCircle2 },
  cancelled:  { label: 'Hủy booking',     variant: 'destructive',  icon: XCircle },
  refunded:   { label: 'Hoàn tiền',       variant: 'outline',      icon: RotateCcw },
  pending:    { label: 'Chờ thanh toán',  variant: 'outline',      icon: ChevronDown },
}

export function BookingStatusAction({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: BookingStatus
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<BookingStatus>(currentStatus)
  const [open, setOpen] = useState(false)

  const config = STATUS_CONFIG[status]
  if (!config || config.nextActions.length === 0) return null

  const handle = (newStatus: BookingStatus) => {
    setOpen(false)
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, newStatus)
      if (res.success) {
        setStatus(newStatus)
        toast.success(`Đã cập nhật: ${ACTION_LABELS[newStatus].label}`)
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
        Đổi trạng thái
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-border bg-white shadow-lg py-1">
            {config.nextActions.map((action) => {
              const actionCfg = ACTION_LABELS[action]
              const Icon = actionCfg.icon
              return (
                <button
                  key={action}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => handle(action)}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {actionCfg.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
