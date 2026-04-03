'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AiItinerary, AiActivity } from '@/lib/schemas/ai-itinerary.schema'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Activity config (shared with ai-planner) ──────────────────────────────────

const activityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  attraction: { icon: Camera,  color: 'text-violet-600', bg: 'bg-violet-100' },
  food:       { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-100' },
  transport:  { icon: Car,     color: 'text-blue-500',   bg: 'bg-blue-100'   },
  hotel:      { icon: Hotel,   color: 'text-emerald-600', bg: 'bg-emerald-100' },
  activity:   { icon: Zap,     color: 'text-pink-500',   bg: 'bg-pink-100'   },
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

// ── Day card (inside detail) ──────────────────────────────────────────────────

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

// ── Itinerary card (list item + expandable detail) ────────────────────────────

function ItineraryCard({ row }: { row: ItineraryRow }) {
  const [expanded, setExpanded] = useState(false)

  // Parse the stored result JSON into AiItinerary shape
  const data = row.result as AiItinerary | null

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Icon */}
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

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

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
              {/* Description */}
              {data.description && (
                <p className="text-sm text-muted-foreground">{data.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> {data.duration_days} ngày
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Wallet className="h-3.5 w-3.5" /> {fmtVND(data.total_cost)}
                </span>
              </div>

              {/* Days timeline */}
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
  )
}

// ── Page client ───────────────────────────────────────────────────────────────

export default function ItinerariesClient({ itineraries }: { itineraries: ItineraryRow[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch trình của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {itineraries.length} lịch trình đã tạo bằng AI
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/ai-planner">
            <PlusCircle className="h-4 w-4" /> Tạo mới
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {itineraries.length === 0 && (
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
      {itineraries.length > 0 && (
        <div className="space-y-4">
          {itineraries.map((row) => (
            <ItineraryCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
