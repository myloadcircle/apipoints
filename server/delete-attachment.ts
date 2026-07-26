import { supabase } from '@/lib/supabase'

export async function deleteAttachment(userId: string, requestId: string, attachmentId: string) {
  // Get attachment metadata
  const { data: attachment, error: metaError } = await supabase
    .from('api_request_attachments_meta')
    .select('path')
    .eq('id', attachmentId)
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .single()

  if (metaError || !attachment) {
    throw new Error('Attachment not found or unauthorized')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('api_request_attachments')
    .remove([attachment.path])

  if (storageError) {
    throw new Error('Failed to delete file from storage')
  }

  // Delete metadata
  const { error: deleteError } = await supabase
    .from('api_request_attachments_meta')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    throw new Error('Failed to delete metadata')
  }
}
