'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, MapPin, CalendarDays, Users, Wallet, Send, Loader2,
  Utensils, Camera, Hotel, Car, Zap, Coffee, Star, ChevronDown,
  Route, Save, X, CheckCircle2, Info, Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { AiItinerary, AiActivity } from '@/lib/schemas/ai-itinerary.schema'
import { saveItinerary } from './actions/ai-planner-actions'

// ── Constants ──────────────────────────────────────────────────────────────────
const AI_PLAN_LIMIT = 10

// ── Types ─────────────────────────────────────────────────────────────────────
interface DestinationOption {
  id: string; name: string; slug: string
  province: string | null; destination_type: string | null
}
interface SuggestedTour {
  name: string; slug: string; price: number
  duration_days: number; avg_rating?: number | null
}
interface AiPlannerPageProps {
  destinations: DestinationOption[]
  isLoggedIn: boolean
  currentPlanCount: number
}

// ── Activity config ───────────────────────────────────────────────────────────
const activityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  attraction: { icon: Camera,   color: 'text-violet-600',  bg: 'bg-violet-100'  },
  food:       { icon: Utensils, color: 'text-orange-500',  bg: 'bg-orange-100'  },
  transport:  { icon: Car,      color: 'text-blue-500',    bg: 'bg-blue-100'    },
  hotel:      { icon: Hotel,    color: 'text-emerald-600', bg: 'bg-emerald-100' },
  activity:   { icon: Zap,      color: 'text-pink-500',    bg: 'bg-pink-100'    },
}
const defaultConfig = { icon: Coffee, color: 'text-gray-500', bg: 'bg-gray-100' }

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

// ── Skeleton while AI is generating ──────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="space-y-4">
      {/* Overview card skeleton */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
      </div>

      {/* Day cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="relative">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          AI đang phân tích và lên kế hoạch chi tiết...
        </p>
      </div>
    </div>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ act, isLast }: { act: AiActivity; isLast: boolean }) {
  const cfg = activityConfig[act.type] ?? defaultConfig
  const Icon = cfg.icon
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" style={{ minHeight: 16 }} />}
      </div>
      <div className="pb-3 pt-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{act.time}</span>
          <span className="text-sm font-medium">{act.place}</span>
        </div>
      </div>
    </div>
  )
}

// ── Day card ──────────────────────────────────────────────────────────────────
function DayCard({ day, index, defaultOpen }: { day: AiItinerary['days'][number]; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="overflow-hidden rounded-2xl border border-border bg-white"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
          {day.day}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{day.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {day.activities.length} hoạt động · <span className="font-medium text-primary">{formatVND(day.cost)}</span>
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pt-4 pb-2">
              {day.activities.map((act, i) => (
                <ActivityRow key={i} act={act} isLast={i === day.activities.length - 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiPlannerPageClient({ destinations, isLoggedIn, currentPlanCount }: AiPlannerPageProps) {
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    destination: '', days: '3', people: '2', budget: '', interests: '',
  })

  useEffect(() => {
    const dest = searchParams.get('destination')
    if (dest) setFormData(p => ({ ...p, destination: dest }))
  }, [searchParams])

  const [loading, setLoading]               = useState(false)
  const [result, setResult]                 = useState<AiItinerary | null>(null)
  const [suggestedTours, setSuggestedTours] = useState<SuggestedTour[]>([])
  const [error, setError]                   = useState('')

  // Save state — use ref to prevent stale closure issues
  const [isSaving, startSaveTransition]     = useTransition()
  const [saved, setSaved]                   = useState(false)
  const [planCount, setPlanCount]           = useState(currentPlanCount)

  // No cancelledRef needed — Cancel is hidden while isSaving

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false)
  const filteredDestinations = useMemo(() => {
    if (!formData.destination) return []
    const q = formData.destination.toLowerCase()
    return destinations.filter(d =>
      d.name.toLowerCase().includes(q) || (d.province && d.province.toLowerCase().includes(q))
    ).slice(0, 6)
  }, [formData.destination, destinations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setSuggestedTours([])
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          days: Number(formData.days),
          people: Number(formData.people),
          budget: formData.budget ? Number(formData.budget) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Đã xảy ra lỗi')
      else { setResult(data.itinerary); setSuggestedTours(data.suggested_tours ?? []) }
    } catch {
      setError('Không thể kết nối đến server')
    } finally {
      setLoading(false)
    }
  }

  // ── Save handler ──────────────────────────────────────────────────────────
  // Once called, the server action WILL execute — there is no abort.
  // The UI prevents cancel by hiding those buttons while isSaving.
  const handleSave = () => {
    if (!result) return
    if (!isLoggedIn) { toast.error('Bạn cần đăng nhập để lưu lịch trình'); return }
    if (planCount >= AI_PLAN_LIMIT) {
      toast.error(`Đã đạt giới hạn ${AI_PLAN_LIMIT} lịch trình. Vào /itineraries để xóa bớt.`); return
    }

    startSaveTransition(async () => {
      const res = await saveItinerary({
        title: result.title ?? `Lịch trình ${formData.destination}`,
        destination_name: formData.destination,
        duration_days: result.duration_days,
        budget: formData.budget ? Number(formData.budget) : null,
        num_people: Number(formData.people),
        result,
        prompt: [formData.destination, formData.days, formData.people, formData.interests].join(' | '),
      })

      if (res.success) {
        setSaved(true)
        setPlanCount(c => c + 1)
        toast.success('Đã lưu lịch trình vào trang Lịch trình của tôi!')
      } else {
        toast.error(res.error ?? 'Không thể lưu lịch trình')
      }
    })
  }

  // ── Cancel handler ────────────────────────────────────────────────────────
  // Only available BEFORE clicking Lưu. Once isSaving, buttons are hidden.
  const handleCancel = () => {
    setResult(null)
    setSuggestedTours([])
    setSaved(false)
    setError('')
  }

  // Reset — keep form, clear result to generate new
  const handleReset = () => {
    setResult(null)
    setSuggestedTours([])
    setSaved(false)
  }

  const isAtLimit = planCount >= AI_PLAN_LIMIT

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
        >
          <Sparkles className="h-4 w-4" /> Công nghệ AI tiên tiến
        </motion.div>
        <h1 className="mb-3 text-3xl font-bold lg:text-5xl">
          Lên kế hoạch với <span className="text-gradient">AI Planner</span>
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Nhập địa điểm và sở thích — AI tạo lịch trình chi tiết theo từng giờ cho bạn
        </p>

        {isLoggedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ${
              isAtLimit ? 'bg-destructive/10 text-destructive'
              : planCount >= 7 ? 'bg-amber-50 text-amber-700'
              : 'bg-muted text-muted-foreground'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            {planCount}/{AI_PLAN_LIMIT} lịch trình đã lưu
            {isAtLimit && ' — Vui lòng xóa bớt'}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Form ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <form
            onSubmit={handleSubmit}
            className="sticky top-24 space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-primary" /> Thông tin chuyến đi
            </h2>

            {/* Destination with autocomplete */}
            <div className="relative space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5" /> Điểm đến
              </Label>
              <Input
                placeholder="Đà Nẵng, Phú Quốc, Sa Pa..."
                value={formData.destination}
                onChange={e => { setFormData(p => ({ ...p, destination: e.target.value })); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                required
              />
              <AnimatePresence>
                {showSuggestions && filteredDestinations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg"
                  >
                    {filteredDestinations.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                        onMouseDown={e => {
                          e.preventDefault()
                          setFormData(p => ({ ...p, destination: d.name }))
                          setShowSuggestions(false)
                        }}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{d.name}</span>
                        {d.province && <span className="text-xs text-muted-foreground">{d.province}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  <CalendarDays className="h-3.5 w-3.5" /> Số ngày
                </Label>
                <Input type="number" min="1" max="14" value={formData.days}
                  onChange={e => setFormData(p => ({ ...p, days: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  <Users className="h-3.5 w-3.5" /> Số người
                </Label>
                <Input type="number" min="1" max="20" value={formData.people}
                  onChange={e => setFormData(p => ({ ...p, people: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <Wallet className="h-3.5 w-3.5" /> Ngân sách (VNĐ)
              </Label>
              <Input placeholder="Để trống = linh hoạt" value={formData.budget}
                onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Sở thích &amp; Yêu cầu</Label>
              <Textarea rows={3} placeholder="Thích ẩm thực, muốn tắm biển, tránh leo núi..."
                value={formData.interests}
                onChange={e => setFormData(p => ({ ...p, interests: e.target.value }))} />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading || isSaving}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> AI đang lên kế hoạch...</>
                : <><Send className="h-4 w-4" /> Tạo lịch trình</>
              }
            </Button>
          </form>
        </motion.div>

        {/* ── Result panel ──────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">

            {/* Skeleton loading while AI is generating */}
            {loading && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultSkeleton />
              </motion.div>
            )}

            {/* Empty / Error state */}
            {!loading && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Sẵn sàng lên đường!</h3>
                <p className="max-w-sm text-muted-foreground">
                  Nhập thông tin chuyến đi bên trái và để AI tạo lịch trình cho bạn
                </p>
                {error && (
                  <p className="mt-4 max-w-md rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </motion.div>
            )}

            {/* Result */}
            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Overview */}
                <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                  <h2 className="mb-1 text-2xl font-bold">{result.title}</h2>
                  <p className="mb-4 text-sm text-muted-foreground">{result.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1 text-xs font-medium shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />{result.duration_days} ngày
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Wallet className="h-3.5 w-3.5" />{formatVND(result.total_cost)}
                    </span>
                  </div>
                </div>

                {/* Days timeline */}
                <div className="space-y-3">
                  {result.days.map((day, i) => (
                    <DayCard key={day.day} day={day} index={i} defaultOpen={i === 0} />
                  ))}
                </div>

                {/* Suggested tours */}
                {suggestedTours.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-bold">
                      <Route className="h-4 w-4 text-primary" /> Tour gợi ý
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {suggestedTours.map(tour => (
                        <a key={tour.slug} href={`/tours/${tour.slug}`}
                          className="group rounded-xl border border-border p-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-sm font-medium group-hover:text-primary line-clamp-2">{tour.name}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />{tour.duration_days} ngày
                            {tour.avg_rating && (
                              <><Star className="h-3 w-3 fill-warning text-warning ml-1" />{Number(tour.avg_rating).toFixed(1)}</>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-primary">{formatVND(tour.price)}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Save / Cancel actions ────────────────────────────── */}
                <div className="rounded-2xl border border-border bg-white p-5">
                  {saved ? (
                    /* ✅ Saved state */
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Đã lưu lịch trình thành công!</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" asChild size="sm">
                          <a href="/itineraries">Xem lịch trình</a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                          Tạo mới
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Save / Cancel / Reset buttons */
                    <div className="space-y-3">
                      {/* While saving: show only progress, hide all other actions */}
                      {isSaving ? (
                        <div className="flex items-center gap-3 py-1">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-sm font-medium">Đang lưu lịch trình, vui lòng chờ...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {!isLoggedIn
                              ? '💡 Đăng nhập để lưu lịch trình này vào tài khoản của bạn.'
                              : isAtLimit
                                ? `⚠️ Đã đạt giới hạn ${AI_PLAN_LIMIT} lịch trình. Hãy xóa bớt trong trang Lịch trình.`
                                : 'Bạn có muốn lưu lịch trình này không?'}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {/* Save button */}
                            {isLoggedIn && !isAtLimit && (
                              <Button className="gap-2" onClick={handleSave}>
                                <Save className="h-4 w-4" /> Lưu lịch trình
                              </Button>
                            )}

                            {/* Manage link when at limit */}
                            {isLoggedIn && isAtLimit && (
                              <Button variant="outline" size="sm" asChild>
                                <a href="/itineraries">Quản lý lịch trình</a>
                              </Button>
                            )}

                            {/* Cancel — only available here, not while saving */}
                            <Button variant="outline" className="gap-2" onClick={handleCancel}>
                              <X className="h-4 w-4" /> Hủy
                            </Button>

                            {/* Reset */}
                            <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={handleReset}>
                              <Clock className="h-4 w-4" /> Tạo lại
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
