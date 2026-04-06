import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hotelId, amenityIds } = await req.json()
    if (!hotelId || !Array.isArray(amenityIds)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.from('hotel_amenities').delete().eq('hotel_id', hotelId)

    if (amenityIds.length > 0) {
      const { error } = await supabase.from('hotel_amenities').insert(
        amenityIds.map((amenity_id: string) => ({ hotel_id: hotelId, amenity_id }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
