import { supabase } from '@/lib/supabase'

export async function logStatusChange(userId: string, apiId: string, requestId: string, oldStatus: string, newStatus: string) {
  const { error } = await supabase
    .from('api_request_status_history')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      old_status: oldStatus,
      new_status: newStatus
    })

  if (error) throw error
}