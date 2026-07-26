import { supabase } from '@/lib/supabase'

export async function saveVersion(userId: string, apiId: string, requestId: string, payload: any) {
  const { error } = await supabase
    .from('api_request_versions')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      payload
    })

  if (error) throw error
}