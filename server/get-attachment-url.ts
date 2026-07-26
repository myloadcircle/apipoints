import { supabase } from '@/lib/supabase'

export async function getAttachmentUrl(path: string) {
  const { data } = supabase.storage
    .from('api_request_attachments')
    .getPublicUrl(path)

  return data.publicUrl
}