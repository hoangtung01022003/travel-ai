import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/upload
 * Content-Type: multipart/form-data
 * Fields: file (image), bucket (string, default: 'travel-media'), folder (string, optional)
 *
 * Returns: { url: string }
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check — chỉ admin mới được upload
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const bucket   = (formData.get('bucket') as string) || 'travel-media'
    const folder   = (formData.get('folder') as string) || 'uploads'

    if (!file || !file.name) {
      return NextResponse.json({ error: 'Vui lòng chọn file ảnh' }, { status: 400 })
    }

    // 3. Validate file type & size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ JPG, PNG, WebP, GIF' }, { status: 400 })
    }

    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File tối đa ${MAX_MB}MB` }, { status: 400 })
    }

    // 4. Build unique file path
    const ext      = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // 5. Upload lên Supabase Storage (dùng admin client để bypass RLS)
    const supabase = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadError) {
      console.error('[upload] storage error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Upload thất bại' },
        { status: 500 }
      )
    }

    // 6. Lấy public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl }, { status: 201 })

  } catch (err) {
    console.error('[upload] unexpected error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
