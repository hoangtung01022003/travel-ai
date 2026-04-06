'use client'

import { useState } from 'react'
import { Star, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  bookingId:  string
  targetType: 'tour' | 'hotel'
  targetId:   string
  itemName:   string
  /** Callback sau khi submit thành công */
  onSuccess?: (review: { id: string; rating: number; comment: string | null; created_at: string }) => void
}

export default function ReviewForm({
  bookingId,
  targetType,
  targetId,
  itemName,
  onSuccess,
}: ReviewFormProps) {
  const [rating,    setRating]    = useState(0)
  const [hovered,   setHovered]   = useState(0)
  const [comment,   setComment]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  const activeRating = hovered || rating

  const handleSubmit = async () => {
    if (rating === 0) { setError('Vui lòng chọn số sao'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, target_type: targetType, target_id: targetId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Có lỗi xảy ra'); return }
      setSubmitted(true)
      onSuccess?.(data.review)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Cảm ơn bạn đã đánh giá <strong>{itemName}</strong>!</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        ⭐ Viết đánh giá
      </p>

      {/* Star selector */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} sao`}
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                star <= activeRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-muted-foreground/40'
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-medium text-amber-600">
            {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition"
        rows={3}
        placeholder="Chia sẻ trải nghiệm của bạn... (tuỳ chọn)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang gửi...</>
            : <><Send className="h-3.5 w-3.5" /> Gửi đánh giá</>
          }
        </Button>
      </div>
    </div>
  )
}
