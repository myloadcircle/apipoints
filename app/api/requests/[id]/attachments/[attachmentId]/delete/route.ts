import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
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
      .select('path')
      .eq('id', attachmentId)
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .single()

    if (metaError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found or unauthorized' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('api_request_attachments')
      .remove([attachment.path])

    if (storageError) {
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete metadata
    const { error: deleteError } = await supabase
      .from('api_request_attachments_meta')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete metadata' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
