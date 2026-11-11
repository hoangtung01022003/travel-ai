import { NextResponse } from 'next/server'
import { ai } from '@/lib/gemini'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  aiItinerarySchema,
  generateItineraryInputSchema,
} from '@/lib/schemas/ai-itinerary.schema'

// Cho phép đủ thời gian xoay qua nhiều model (Vercel mặc định chỉ 10–15s)
export const maxDuration = 60

// ── Model rotation ───────────────────────────────────────────────────────────
// Hạn mức free tier (theo AI Studio): Flash Lite 4K RPM / 150K RPD, Flash 1K RPM / 10K RPD.
// Nhóm "primary" được xoay vòng (round-robin) để chia tải RPM giữa các model;
// nhóm "backup" chỉ dùng khi toàn bộ primary lỗi. gemini-3.8-flash để cuối vì phản hồi rất chậm.
const PRIMARY_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
]
const BACKUP_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
]

// Model bị 429 / 404 sẽ bị tạm "nghỉ" để request sau không gọi lại vô ích.
// (Lưu trong bộ nhớ của instance server — đủ dùng, không cần DB.)
const RATE_LIMIT_COOLDOWN_MS = 60_000
const NOT_FOUND_COOLDOWN_MS = 60 * 60_000
const modelCooldownUntil = new Map<string, number>()
let rrIndex = 0

function modelOrder(): string[] {
  const now = Date.now()
  const start = rrIndex++ % PRIMARY_MODELS.length
  const rotated = [...PRIMARY_MODELS.slice(start), ...PRIMARY_MODELS.slice(0, start)]
  const all = [...rotated, ...BACKUP_MODELS]
  const healthy = all.filter((m) => (modelCooldownUntil.get(m) ?? 0) <= now)
  // Nếu tất cả đều đang nghỉ thì vẫn thử hết (có thể quota đã hồi)
  return healthy.length ? healthy : all
}

/**
 * Gọi Gemini, tự xoay model. `parse` chạy trên text trả về — nếu ném lỗi
 * (JSON hỏng / bị cắt cụt) thì cũng chuyển sang model tiếp theo.
 */
async function generateWithRotation<T>(
  prompt: string,
  parse: (text: string) => T
): Promise<{ data: T; model: string }> {
  let lastError: unknown

  for (const model of modelOrder()) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 16384,
          },
        })
        const text = result.text ?? ''
        if (!text) throw new Error('EMPTY_RESPONSE')
        try {
          return { data: parse(text), model }
        } catch (parseErr) {
          console.warn(`[Gemini API] ${model} trả JSON không hợp lệ, thử model khác:`, String(parseErr).slice(0, 200))
          lastError = parseErr
          break
        }
      } catch (err: unknown) {
        lastError = err
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[Gemini API] ${model} (lần ${attempt}) thất bại:`, msg.slice(0, 200))

        if (msg.includes('prepayment credits are depleted') || msg.includes('402')) {
          throw new Error(
            'API Key Gemini đã hết hạn mức tín dụng trả trước. Vui lòng nạp thêm credit hoặc tạo API Key mới (Free tier) tại aistudio.google.com.'
          )
        }

        const isOverload = /503|UNAVAILABLE|overloaded/i.test(msg)
        const isRateLimit = /429|RESOURCE_EXHAUSTED|quota/i.test(msg)
        const isModelNotFound = /404|NOT_FOUND|not supported|not available|no longer available/i.test(msg)

        if (isRateLimit) {
          modelCooldownUntil.set(model, Date.now() + RATE_LIMIT_COOLDOWN_MS)
          break
        }
        if (isModelNotFound) {
          modelCooldownUntil.set(model, Date.now() + NOT_FOUND_COOLDOWN_MS)
          break
        }
        if (isOverload && attempt === 1) {
          await new Promise((r) => setTimeout(r, 1500))
          continue
        }
        break
      }
    }
  }

  throw (
    lastError ??
    new Error('Tất cả model AI hiện không khả dụng hoặc đã hết hạn mức. Vui lòng thử lại sau vài phút.')
  )
}

/** Tách JSON, parse và validate; ném lỗi nếu JSON hỏng hoặc thiếu cấu trúc chính. */
function parseItinerary(rawText: string) {
  const rawParsed = JSON.parse(extractJSON(rawText))
  const validated = aiItinerarySchema.safeParse(rawParsed)
  if (validated.success) return validated.data
  console.warn(
    '[AI Itinerary] Zod validation warnings:',
    validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
  )
  if (!rawParsed || !Array.isArray(rawParsed.days) || rawParsed.days.length === 0) {
    throw new Error('Itinerary thiếu danh sách ngày')
  }
  return rawParsed
}


// ── POST /api/ai/generate-itinerary ──────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ─── 1. Parse & validate input ───────────────────────────────────────────

    const body = await request.json()

    const input = {
      destination: body.destination ?? '',
      days: Number(body.days) || 3,
      people: Number(body.people) || 2,
      budget: body.budget ? Number(body.budget) : undefined,
      interests: body.interests || '',
    }

    const parsed = generateItineraryInputSchema.safeParse(input)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { destination, days, budget, people, interests } = parsed.data

    // ─── 2. Check auth & rate limit ──────────────────────────────────────────

    let userId: string | null = null
    try {
      const serverClient = await createClient()
      const {
        data: { user },
      } = await serverClient.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // Not logged in — that's fine, just don't save
    }

    const supabase = createAdminClient()

    // Rate limit: 10 requests/user/hour (only for authenticated users)
    if (userId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('ai_prompt_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo)

      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          { error: 'Bạn đã đạt giới hạn 10 lần/giờ. Vui lòng thử lại sau.' },
          { status: 429 }
        )
      }
    }

    // ─── 3. Fetch destination context from DB ────────────────────────────────

    const { data: destData } = await supabase
      .from('destinations')
      .select(
        'id, name, province, destination_type, description, min_price, suggested_days'
      )
      .or(`name.ilike.%${destination}%,province.ilike.%${destination}%`)
      .limit(1)
      .maybeSingle()

    let attractions: {
      name: string
      description: string | null
      entry_fee: number | null
    }[] = []
    let relatedTours: {
      name: string
      slug: string
      price: number
      duration_days: number
      cover_image: string | null
      avg_rating: number | null
    }[] = []

    if (destData) {
      const [{ data: attrs }, { data: tours }] = await Promise.all([
        supabase
          .from('attractions')
          .select('name, description, entry_fee')
          .eq('destination_id', destData.id)
          .order('sort_order')
          .limit(15),
        supabase
          .from('tours')
          .select('name, slug, price, duration_days, cover_image, avg_rating')
          .eq('destination_id', destData.id)
          .eq('is_active', true)
          .limit(5),
      ])
      attractions = attrs ?? []
      relatedTours = tours ?? []
    }

    // ─── 4. Build prompt ─────────────────────────────────────────────────────

    const destName = destData?.name ?? destination
    const contextParts: string[] = []

    if (destData) {
      contextParts.push(`${destData.name} (${destData.province}, ${destData.destination_type})`)
      if (attractions.length > 0) {
        contextParts.push(`Điểm tham quan: ${attractions.map((a) => a.name).join(', ')}`)
      }
    }

    const fullPrompt = `Bạn là chuyên gia du lịch Việt Nam. Tạo lịch trình ${days} ngày tại ${destName} cho ${people} người.
${budget ? `Ngân sách: ${budget.toLocaleString('vi-VN')} VND.` : ''}
${interests ? `Sở thích: ${interests}.` : ''}
${contextParts.length > 0 ? `Thông tin: ${contextParts.join('. ')}` : ''}

Trả về JSON đúng format sau (tiếng Việt, chi phí VND):
{
  "title": "Tên lịch trình ngắn gọn",
  "description": "Mô tả 1-2 câu",
  "duration_days": ${days},
  "total_cost": number,
  "days": [
    {
      "day": 1,
      "title": "Tiêu đề ngày",
      "cost": number,
      "activities": [
        { "time": "HH:MM", "place": "Tên địa điểm/hoạt động", "type": "attraction"|"food"|"transport"|"hotel"|"activity" }
      ]
    }
  ]
}
Mỗi ngày 5-8 hoạt động. CHỈ trả về JSON, không thêm text.`

    // ─── 5. Call Gemini (with model fallback for 503) ───────────────────────

    // ─── 6. Parse & validate (JSON hỏng → tự thử model khác) ─────────────────

    let itinerary
    let usedModel: string
    try {
      const res = await generateWithRotation(fullPrompt, parseItinerary)
      itinerary = res.data
      usedModel = res.model
    } catch (geminiErr: unknown) {
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
      console.error('[AI Itinerary] Tất cả model thất bại:', msg)
      const isBusy = /503|UNAVAILABLE|overloaded|429|RESOURCE_EXHAUSTED|quota/i.test(msg)
      return NextResponse.json(
        {
          error: isBusy
            ? 'Dịch vụ AI đang bận, vui lòng thử lại sau 1-2 phút.'
            : 'AI chưa tạo được lịch trình hợp lệ, vui lòng thử lại.',
        },
        { status: isBusy ? 503 : 500 }
      )
    }

    // ─── 7. Get suggested tours ──────────────────────────────────────────────

    let suggestedTours = relatedTours

    if (destData && relatedTours.length === 0) {
      const { data: fallbackTours } = await supabase
        .from('tours')
        .select('name, slug, price, duration_days, cover_image, avg_rating')
        .eq('is_active', true)
        .limit(3)

      suggestedTours = fallbackTours ?? []
    }

    // ─── 8. Log prompt usage only (save is handled by saveItinerary action) ──
    // Auto-save removed: user explicitly clicks "Lưu lịch trình" to persist.

    const userPrompt = `${days} ngày ${destData?.name ?? destination}, ${people} người, ${budget ? formatBudget(budget) : 'linh hoạt'}`

    if (userId) {
      try {
        await supabase.from('ai_prompt_logs').insert({
          user_id: userId,
          prompt: userPrompt,
          model: usedModel,
          tokens_used: null,
        })
      } catch (logErr) {
        console.warn('[AI Itinerary] Log failed:', logErr)
      }
    }

    // ─── 9. Return ───────────────────────────────────────────────────────────

    return NextResponse.json({
      itinerary,
      suggested_tours: suggestedTours,
    })
  } catch (error) {
    console.error('[AI Generate Itinerary Error]', error)
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: `Đã xảy ra lỗi khi tạo lịch trình: ${message}`,
      },
      { status: 500 }
    )
  }
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

/**
 * Extract JSON from AI response that may contain markdown fences,
 * thinking tokens, or extra text wrapping the JSON object.
 */
function extractJSON(text: string): string {
  // 1. Try direct parse first
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed

  // 2. Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()

  // 3. Find first { and last } — extract the JSON object
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  // 4. Return as-is and let JSON.parse() handle the error
  return trimmed
}
