'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Send,
  Loader2,
  Clock,
  Utensils,
  Camera,
  Hotel,
  Car,
  Star,
  ChevronDown,
  Route,
  Zap,
  Coffee,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AiItinerary, AiActivity } from '@/lib/schemas/ai-itinerary.schema'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DestinationOption {
  id: string
  name: string
  slug: string
  province: string | null
  destination_type: string | null
}

interface SuggestedTour {
  name: string
  slug: string
  price: number
  duration_days: number
  avg_rating?: number | null
}

interface AiPlannerPageProps {
  destinations: DestinationOption[]
}

// ── Activity config ───────────────────────────────────────────────────────────

const activityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  attraction: { icon: Camera, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Tham quan' },
  food:        { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Ăn uống' },
  transport:   { icon: Car, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Di chuyển' },
  hotel:       { icon: Hotel, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Nghỉ ngơi' },
  activity:    { icon: Zap, color: 'text-pink-500', bg: 'bg-pink-100', label: 'Hoạt động' },
}

const defaultConfig = { icon: Coffee, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Khác' }

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)

// ── Sub-components ────────────────────────────────────────────────────────────

function ActivityRow({ act, isLast }: { act: AiActivity; isLast: boolean }) {
  const cfg = activityConfig[act.type] ?? defaultConfig
  const Icon = cfg.icon

  return (
    <div className="flex gap-3">
      {/* connector line + dot */}
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" style={{ minHeight: 16 }} />}
      </div>

      {/* content */}
      <div className="pb-3 pt-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
            {act.time}
          </span>
          <span className="text-sm font-medium leading-snug">{act.place}</span>
        </div>
      </div>
    </div>
  )
}

function DayCard({
  day,
  index,
  defaultOpen,
}: {
  day: AiItinerary['days'][number]
  index: number
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="overflow-hidden rounded-2xl border border-border bg-white"
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        {/* Day badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
          {day.day}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{day.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {day.activities.length} hoạt động &middot;{' '}
            <span className="font-medium text-primary">{formatVND(day.cost)}</span>
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Activity list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pt-4 pb-2">
              {day.activities.map((act, i) => (
                <ActivityRow
                  key={i}
                  act={act}
                  isLast={i === day.activities.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiPlannerPageClient({ destinations }: AiPlannerPageProps) {
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    destination: '',
    days: '3',
    people: '2',
    budget: '',
    interests: '',
  })

  // Pre-fill destination from URL param (?destination=Đà+Nẵng)
  useEffect(() => {
    const dest = searchParams.get('destination')
    if (dest) setFormData((p) => ({ ...p, destination: dest }))
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiItinerary | null>(null)
  const [suggestedTours, setSuggestedTours] = useState<SuggestedTour[]>([])
  const [error, setError] = useState('')

  // Destination autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false)
  const filteredDestinations = useMemo(() => {
    if (!formData.destination) return []
    const q = formData.destination.toLowerCase()
    return destinations
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.province && d.province.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [formData.destination, destinations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setSuggestedTours([])
    setError('')

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
      if (!res.ok) {
        setError(data.error || 'Đã xảy ra lỗi')
      } else {
        setResult(data.itinerary)
        setSuggestedTours(data.suggested_tours ?? [])
      }
    } catch {
      setError('Không thể kết nối đến server')
    } finally {
      setLoading(false)
    }
  }

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
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Form ─────────────────────────────────────────────────── */}
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
                onChange={(e) => {
                  setFormData((p) => ({ ...p, destination: e.target.value }))
                  setShowSuggestions(true)
                }}
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
                    {filteredDestinations.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setFormData((p) => ({ ...p, destination: d.name }))
                          setShowSuggestions(false)
                        }}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{d.name}</span>
                        {d.province && (
                          <span className="text-xs text-muted-foreground">{d.province}</span>
                        )}
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
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.days}
                  onChange={(e) => setFormData((p) => ({ ...p, days: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  <Users className="h-3.5 w-3.5" /> Số người
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.people}
                  onChange={(e) => setFormData((p) => ({ ...p, people: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <Wallet className="h-3.5 w-3.5" /> Ngân sách (VNĐ)
              </Label>
              <Input
                placeholder="Để trống = linh hoạt"
                value={formData.budget}
                onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Sở thích &amp; Yêu cầu</Label>
              <Textarea
                placeholder="Thích ẩm thực, muốn tắm biển, tránh leo núi..."
                rows={3}
                value={formData.interests}
                onChange={(e) => setFormData((p) => ({ ...p, interests: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> AI đang lên kế hoạch...</>
              ) : (
                <><Send className="h-4 w-4" /> Tạo lịch trình</>
              )}
            </Button>
          </form>
        </motion.div>

        {/* ── Result panel ──────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="relative mb-6">
                  <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <p className="text-lg font-medium">AI đang lên kế hoạch...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Phân tích điểm đến, lên lịch theo từng giờ
                </p>
              </motion.div>
            )}

            {/* Empty / Error */}
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
                {/* Overview card */}
                <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                  <h2 className="mb-1 text-2xl font-bold">{result.title}</h2>
                  <p className="mb-4 text-sm text-muted-foreground">{result.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1 text-xs font-medium shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {result.duration_days} ngày
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Wallet className="h-3.5 w-3.5" />
                      {formatVND(result.total_cost)}
                    </span>
                  </div>
                </div>

                {/* Day-by-day timeline */}
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
                      {suggestedTours.map((tour) => (
                        <a
                          key={tour.slug}
                          href={`/tours/${tour.slug}`}
                          className="group rounded-xl border border-border p-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-sm font-medium group-hover:text-primary line-clamp-2">
                            {tour.name}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" /> {tour.duration_days} ngày
                            {tour.avg_rating && (
                              <>
                                <Star className="h-3 w-3 fill-warning text-warning ml-1" />
                                {Number(tour.avg_rating).toFixed(1)}
                              </>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-primary">
                            {formatVND(tour.price)}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset */}
                <Button
                  variant="outline"
                  onClick={() => { setResult(null); setSuggestedTours([]) }}
                >
                  Tạo lại
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
