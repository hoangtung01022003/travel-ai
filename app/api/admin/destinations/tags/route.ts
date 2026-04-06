import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { destinationId, tagIds } = await req.json()
    if (!destinationId || !Array.isArray(tagIds)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.from('destination_tags').delete().eq('destination_id', destinationId)

    if (tagIds.length > 0) {
      const { error } = await supabase.from('destination_tags').insert(
        tagIds.map((tag_id: string) => ({ destination_id: destinationId, tag_id }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
