import { supabase } from '@/lib/supabase'

export async function uploadAttachment(userId: string, apiId: string, requestId: string, file: File) {
  const path = `${userId}/${apiId}/${requestId}/${Date.now()}-${file.name}`

  const { error: uploadErr } = await supabase.storage
    .from('api_request_attachments')
    .upload(path, file)

  if (uploadErr) throw uploadErr

  const { error: dbErr } = await supabase
    .from('api_request_attachments_meta')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      path,
      filename: file.name,
      size: file.size,
      type: file.type
    })

  if (dbErr) throw dbErr
}