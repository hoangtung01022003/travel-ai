import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // Auth check
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tourId, itineraries } = await req.json()

    if (!tourId || !Array.isArray(itineraries)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete existing itineraries for this tour
    const { error: deleteError } = await supabase
      .from('tour_itineraries')
      .delete()
      .eq('tour_id', tourId)

    if (deleteError) {
      console.error('[itineraries] delete error:', deleteError)
      return NextResponse.json({ error: 'Cannot clear old itineraries' }, { status: 500 })
    }

    // Insert new itineraries
    const inserts = itineraries.map((itin: any) => ({
      tour_id: tourId,
      day_number: itin.day_number,
      title: itin.title,
      description: itin.description,
      sort_order: itin.day_number,
    }))

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('tour_itineraries')
        .insert(inserts)

      if (insertError) {
        console.error('[itineraries] insert error:', insertError)
        return NextResponse.json({ error: 'Cannot save itineraries' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error('[itineraries] error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
