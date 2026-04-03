import { NextResponse } from 'next/server'
import { ai } from '@/lib/gemini'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  aiItinerarySchema,
  generateItineraryInputSchema,
} from '@/lib/schemas/ai-itinerary.schema'

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

    // ─── 5. Call Gemini ──────────────────────────────────────────────────────

    const geminiResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    })

    const rawText = geminiResult.text ?? ''
    if (!rawText) {
      return NextResponse.json(
        { error: 'AI không trả về kết quả. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // ─── 6. Parse & validate response ────────────────────────────────────────
    // Gemini 2.5 (thinking model) may wrap JSON in markdown fences or extra text

    let itinerary
    try {
      const jsonStr = extractJSON(rawText)
      const rawParsed = JSON.parse(jsonStr)
      const validated = aiItinerarySchema.safeParse(rawParsed)

      if (validated.success) {
        itinerary = validated.data
      } else {
        console.warn(
          '[AI Itinerary] Zod validation warnings:',
          validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        )
        itinerary = rawParsed
      }
    } catch (parseErr) {
      console.error('[AI Itinerary] JSON parse failed:', parseErr)
      console.error('[AI Itinerary] Raw text (first 500 chars):', rawText.slice(0, 500))
      return NextResponse.json(
        { error: `AI response không hợp lệ: ${rawText.slice(0, 100)}...` },
        { status: 500 }
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

    // ─── 8. Persist (if logged in) ───────────────────────────────────────────

    const userPrompt = `${days} ngày ${destData?.name ?? destination}, ${people} người, ${budget ? formatBudget(budget) : 'linh hoạt'}`

    if (userId) {
      try {
        await Promise.all([
          supabase.from('ai_itineraries').insert({
            user_id: userId,
            prompt: userPrompt,
            result: itinerary as unknown as Record<string, unknown>,
            title: itinerary.title ?? `${destData?.name ?? destination} — ${days} ngày`,
            destination_name: destData?.name ?? destination,
            duration_days: days,
            budget: budget ?? null,
            num_people: people,
          }),
          supabase.from('ai_prompt_logs').insert({
            user_id: userId,
            prompt: userPrompt,
            model: 'gemini-1.5-flash',
            tokens_used: null,
          }),
        ])
      } catch (saveErr) {
        console.warn('[AI Itinerary] Save failed:', saveErr)
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
