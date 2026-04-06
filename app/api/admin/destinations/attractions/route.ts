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

    const { destinationId, attractions } = await req.json()

    if (!destinationId || !Array.isArray(attractions)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete existing attractions for this destination
    const { error: deleteError } = await supabase
      .from('attractions')
      .delete()
      .eq('destination_id', destinationId)

    if (deleteError) {
      console.error('[attractions] delete error:', deleteError)
      return NextResponse.json({ error: 'Cannot clear old attractions' }, { status: 500 })
    }

    // Insert new attractions
    const inserts = attractions.map((attr: any, index: number) => ({
      destination_id: destinationId,
      name: attr.name,
      description: attr.description,
      image_url: attr.image_url,
      entry_fee: attr.entry_fee,
      sort_order: index + 1,
    }))

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('attractions')
        .insert(inserts)

      if (insertError) {
        console.error('[attractions] insert error:', insertError)
        return NextResponse.json({ error: 'Cannot save attractions' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error('[attractions] error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
