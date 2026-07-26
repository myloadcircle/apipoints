import { supabase } from '@/lib/supabase'

export async function createSubtask(userId: string, apiId: string, requestId: string, title: string) {
  const { error } = await supabase
    .from('api_request_subtasks')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      title,
      completed: false
    })

  if (error) throw error
}