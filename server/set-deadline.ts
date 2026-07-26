import { supabase } from '@/lib/supabase'

export async function setDeadline(userId: string, apiId: string, requestId: string, deadline: string) {
  const { error } = await supabase
    .from('api_request_deadlines')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      deadline
    })

  if (error) throw error
}