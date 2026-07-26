import { supabase } from '@/lib/supabase'

export async function setFlag(userId: string, apiId: string, requestId: string, flag: string, value: boolean) {
  const { error } = await supabase
    .from('api_request_flags')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      flag,
      value
    })

  if (error) throw error
}