import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { destinationId, images } = await req.json()
    if (!destinationId || !Array.isArray(images)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.from('destination_images').delete().eq('destination_id', destinationId)

    const validImages = images.filter((img: any) => img.image_url?.trim())
    if (validImages.length > 0) {
      const { error } = await supabase.from('destination_images').insert(
        validImages.map((img: any, i: number) => ({
          destination_id: destinationId,
          image_url: img.image_url,
          caption: img.caption ?? '',
          sort_order: i + 1,
        }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
