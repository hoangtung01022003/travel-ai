import { z } from 'zod'

// ── Simplified Activity ───────────────────────────────────────────────────────

export const aiActivitySchema = z.object({
  time: z.string(),
  place: z.string(),
  type: z.enum(['attraction', 'food', 'transport', 'hotel', 'activity']),
})

// ── Day ───────────────────────────────────────────────────────────────────────

export const aiDaySchema = z.object({
  day: z.number(),
  title: z.string(),
  cost: z.number(),
  activities: z.array(aiActivitySchema),
})

// ── Full Itinerary (output from AI) ───────────────────────────────────────────

export const aiItinerarySchema = z.object({
  title: z.string(),
  description: z.string(),
  duration_days: z.number(),
  total_cost: z.number(),
  days: z.array(aiDaySchema),
})

// ── Input schema (from client form) ───────────────────────────────────────────

export const generateItineraryInputSchema = z.object({
  destination: z.string().min(1, 'Vui lòng nhập điểm đến'),
  days: z.number().min(1).max(14),
  people: z.number().min(1).max(20),
  budget: z.number().min(0).optional(),
  interests: z.string().optional(),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiItinerary = z.infer<typeof aiItinerarySchema>
export type AiDay = z.infer<typeof aiDaySchema>
export type AiActivity = z.infer<typeof aiActivitySchema>
export type GenerateItineraryInput = z.infer<typeof generateItineraryInputSchema>
