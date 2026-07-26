import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const requestId = params.id
  const attachmentId = params.attachmentId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    // Get attachment metadata
    const { data: attachment, error: metaError } = await supabase
      .from('api_request_attachments_meta')
      .select('*')
      .eq('id', attachmentId)
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .single()

    if (metaError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found or unauthorized' }, { status: 403 })
    }

    // Generate signed URL (valid for 60 seconds)
    const { data, error: signedUrlError } = await supabase.storage
      .from('api_request_attachments')
      .createSignedUrl(attachment.path, 60)

    if (signedUrlError || !data) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
