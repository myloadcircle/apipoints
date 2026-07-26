import { supabase } from '@/lib/supabase'

export async function setPriority(userId: string, apiId: string, requestId: string, priority: string) {
  const { error } = await supabase
    .from('api_request_priority')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      priority
    })

  if (error) throw error
}