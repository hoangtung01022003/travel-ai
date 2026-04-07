'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  MapPin,
  Wallet,
  Users,
  ChevronDown,
  Sparkles,
  Clock,
  Camera,
  Utensils,
  Car,
  Hotel,
  Zap,
  Coffee,
  PlusCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AiItinerary, AiActivity } from '@/lib/schemas/ai-itinerary.schema'
import { deleteItinerary } from './actions/itinerary-actions'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

const AI_PLAN_LIMIT = 10

interface ItineraryRow {
  id: string
  title: string | null
  destination_name: string | null
  duration_days: number | null
  budget: number | null
  num_people: number | null
  result: unknown
  created_at: string
}

// ── Activity config ───────────────────────────────────────────────────────────

const activityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  attraction: { icon: Camera,   color: 'text-violet-600',  bg: 'bg-violet-100'  },
  food:       { icon: Utensils, color: 'text-orange-500',  bg: 'bg-orange-100'  },
  transport:  { icon: Car,      color: 'text-blue-500',    bg: 'bg-blue-100'    },
  hotel:      { icon: Hotel,    color: 'text-emerald-600', bg: 'bg-emerald-100' },
  activity:   { icon: Zap,      color: 'text-pink-500',    bg: 'bg-pink-100'    },
}
const defaultCfg = { icon: Coffee, color: 'text-gray-500', bg: 'bg-gray-100' }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const fmtDate = (dt: string) =>
  new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ act, isLast }: { act: AiActivity; isLast: boolean }) {
  const cfg = activityConfig[act.type] ?? defaultCfg
  const Icon = cfg.icon
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" style={{ minHeight: 16 }} />}
      </div>
      <div className="pb-3 pt-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground w-10 shrink-0">{act.time}</span>
          <span className="text-sm font-medium">{act.place}</span>
        </div>
      </div>
    </div>
  )
}

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({ day, index }: { day: AiItinerary['days'][number]; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {day.day}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{day.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {day.activities.length} hoạt động ·{' '}
            <span className="font-medium text-primary">{fmtVND(day.cost)}</span>
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
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
    </div>
  )
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mb-1 text-lg font-bold">Xóa lịch trình?</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          Lịch trình <strong>&ldquo;{title}&rdquo;</strong> sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            <X className="h-4 w-4 mr-1.5" /> Hủy
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
            Xóa
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Itinerary card ────────────────────────────────────────────────────────────

function ItineraryCard({
  row,
  onDeleted,
}: {
  row: ItineraryRow
  onDeleted: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const data = row.result as AiItinerary | null

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteItinerary(row.id)
      if (res.success) {
        setShowConfirm(false)
        onDeleted(row.id)
        toast.success('Đã xóa lịch trình thành công')
      } else {
        toast.error(res.error ?? 'Không thể xóa lịch trình')
      }
    })
  }

  return (
    <>
      <motion.div
        layout
        className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      >
        {/* Summary row */}
        <div className="flex w-full items-start gap-4 p-5">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex flex-1 items-start gap-4 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{row.title ?? 'Lịch trình'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {row.destination_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {row.destination_name}
                  </span>
                )}
                {row.duration_days && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {row.duration_days} ngày
                  </span>
                )}
                {row.num_people && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {row.num_people} người
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmtDate(row.created_at)}
                </span>
              </div>
              {data?.total_cost && (
                <p className="mt-1.5 text-sm font-semibold text-primary">{fmtVND(data.total_cost)}</p>
              )}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1 mt-1">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Xóa lịch trình"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        <AnimatePresence initial={false}>
          {expanded && data && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                {data.description && (
                  <p className="text-sm text-muted-foreground">{data.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> {data.duration_days} ngày
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Wallet className="h-3.5 w-3.5" /> {fmtVND(data.total_cost)}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.days?.map((day, i) => (
                    <DayCard key={day.day} day={day} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirm delete dialog */}
      {showConfirm && (
        <ConfirmDeleteDialog
          title={row.title ?? 'Lịch trình'}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={isPending}
        />
      )}
    </>
  )
}

// ── Page client ───────────────────────────────────────────────────────────────

export default function ItinerariesClient({ itineraries }: { itineraries: ItineraryRow[] }) {
  const [list, setList] = useState(itineraries)

  const handleDeleted = (id: string) => {
    setList((prev) => prev.filter((row) => row.id !== id))
  }

  const usedCount = list.length
  const isAtLimit = usedCount >= AI_PLAN_LIMIT
  const quotaPercent = Math.min(100, (usedCount / AI_PLAN_LIMIT) * 100)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch trình của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {usedCount} lịch trình đã tạo bằng AI
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/ai-planner">
            <PlusCircle className="h-4 w-4" /> Tạo mới
          </Link>
        </Button>
      </div>

      {/* Quota bar */}
      <div className={`rounded-2xl border p-4 ${isAtLimit ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-white'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Dung lượng lịch trình AI
          </span>
          <span className={`text-sm font-bold ${isAtLimit ? 'text-destructive' : 'text-primary'}`}>
            {usedCount}/{AI_PLAN_LIMIT}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isAtLimit ? 'bg-destructive' : usedCount >= 7 ? 'bg-amber-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${quotaPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {isAtLimit && (
          <p className="mt-2 text-xs text-destructive">
            Đã đạt giới hạn — Xóa bớt lịch trình để tạo mới
          </p>
        )}
        {!isAtLimit && (
          <p className="mt-2 text-xs text-muted-foreground">
            Còn {AI_PLAN_LIMIT - usedCount} lịch trình có thể lưu
          </p>
        )}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-1 font-semibold">Chưa có lịch trình nào</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Hãy tạo lịch trình đầu tiên của bạn với AI Planner
          </p>
          <Button asChild className="gap-2">
            <Link href="/ai-planner">
              <Sparkles className="h-4 w-4" /> Tạo lịch trình AI
            </Link>
          </Button>
        </div>
      )}

      {/* List */}
      {list.length > 0 && (
        <div className="space-y-4">
          {list.map((row) => (
            <ItineraryCard key={row.id} row={row} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
