import { supabase } from '@/lib/supabase'

// Activity types are now open strings to allow extensibility
export type ActivityType = string

export async function logActivity(
  userId: string,
  requestId: string,
  type: string,
  payload: any = {}
) {
  const { error } = await supabase
    .from('api_request_activity')
    .insert({
      request_id: requestId,
      actor_id: userId,
      type,
      payload
    })

  if (error) throw error
}
