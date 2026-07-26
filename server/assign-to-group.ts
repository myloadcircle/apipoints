import { supabase } from '@/lib/supabase'

export async function assignToGroup(userId: string, apiId: string, requestId: string, groupId: string) {
  const { error } = await supabase
    .from('api_request_group_items')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      group_id: groupId
    })

  if (error) throw error
}