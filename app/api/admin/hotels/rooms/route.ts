import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hotelId, rooms } = await req.json()
    if (!hotelId || !Array.isArray(rooms)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createAdminClient()
    // Delete and re-create all rooms (upsert approach)
    await supabase.from('room_types').delete().eq('hotel_id', hotelId)

    const validRooms = rooms.filter((r: any) => r.name?.trim() && r.price_per_night > 0)
    if (validRooms.length > 0) {
      const { error } = await supabase.from('room_types').insert(
        validRooms.map((r: any) => ({
          hotel_id: hotelId,
          name: r.name,
          description: r.description ?? null,
          price_per_night: Number(r.price_per_night),
          max_guests: Number(r.max_guests) || 2,
          bed_type: r.bed_type ?? null,
          room_size: r.room_size ? Number(r.room_size) : null,
          image_url: r.image_url ?? null,
          is_available: r.is_available !== false,
        }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
