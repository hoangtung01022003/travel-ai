'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleReviewVisibility, deleteReview, resolveReport } from './actions'
import { toast } from 'sonner'

// ── Toggle visibility button ──────────────────────────────────────────────────

export function ReviewVisibilityToggle({
  reviewId,
  isVisible,
}: {
  reviewId: string
  isVisible: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [visible, setVisible] = useState(isVisible)

  const handle = () => {
    startTransition(async () => {
      const res = await toggleReviewVisibility(reviewId, visible)
      if (res.success) {
        setVisible((v) => !v)
        toast.success(visible ? 'Đã ẩn review' : 'Đã hiện review')
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  return (
    <Button
      size="sm"
      variant={visible ? 'outline' : 'secondary'}
      className="h-7 gap-1 px-2 text-xs"
      onClick={handle}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : visible ? (
        <><EyeOff className="h-3 w-3" /> Ẩn</>
      ) : (
        <><Eye className="h-3 w-3" /> Hiện</>
      )}
    </Button>
  )
}

// ── Delete review button ───────────────────────────────────────────────────────

export function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition()
  const [deleted, setDeleted] = useState(false)

  const handle = () => {
    if (!confirm('Xác nhận xóa review này? Hành động không thể hoàn tác.')) return
    startTransition(async () => {
      const res = await deleteReview(reviewId)
      if (res.success) {
        setDeleted(true)
        toast.success('Đã xóa review')
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  if (deleted) return null

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handle}
      disabled={pending}
      title="Xóa review"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  )
}

// ── Resolve report buttons ─────────────────────────────────────────────────────

export function ReportActionButtons({
  reportId,
  reviewId,
}: {
  reportId: string
  reviewId: string
}) {
  const [pending, startTransition] = useTransition()
  const [resolved, setResolved] = useState(false)

  const handle = (action: 'dismiss' | 'hide_review') => {
    startTransition(async () => {
      const res = await resolveReport(reportId, action, reviewId)
      if (res.success) {
        setResolved(true)
        toast.success(action === 'dismiss' ? 'Đã bỏ qua báo cáo' : 'Đã ẩn review & đóng báo cáo')
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  if (resolved) {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircle className="h-3 w-3" /> Đã xử lý
      </span>
    )
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="destructive"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => handle('hide_review')}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <EyeOff className="h-3 w-3" />}
        Ẩn review
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => handle('dismiss')}
        disabled={pending}
      >
        <XCircle className="h-3 w-3" /> Bỏ qua
      </Button>
    </div>
  )
}
