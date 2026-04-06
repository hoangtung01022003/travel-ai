import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Link existing attractions to a destination (update their destination_id)
 * POST /api/admin/destinations/link-attractions
 */
export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { destinationId, attractionIds } = await req.json()
    if (!destinationId || !Array.isArray(attractionIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update destination_id for selected attractions
    const { error } = await supabase
      .from('attractions')
      .update({ destination_id: destinationId })
      .in('id', attractionIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
