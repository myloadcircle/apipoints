import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verify request exists and user owns it
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('id, user_id, api_id')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single()

    if (reqError || !request) {
      return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 403 })
    }

    // Generate unique attachment ID
    const attachmentId = crypto.randomUUID()
    const fileExt = file.name.split('.').pop()
    const storagePath = `${requestId}/${attachmentId}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('api_request_attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    // Save metadata
    const { data: meta, error: metaError } = await supabase
      .from('api_request_attachments_meta')
      .insert({
        id: attachmentId,
        user_id: userId,
        api_id: request.api_id,
        request_id: requestId,
        path: storagePath,
        filename: file.name,
        size: file.size,
        type: file.type
      })
      .select()
      .single()

    if (metaError) {
      // Clean up storage on metadata failure
      await supabase.storage.from('api_request_attachments').remove([storagePath])
      return NextResponse.json({ error: 'Metadata save failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, attachment: meta })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
