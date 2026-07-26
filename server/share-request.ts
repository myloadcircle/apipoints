import { supabase } from '@/lib/supabase'

export async function shareRequest(userId: string, apiId: string, requestId: string, targetUserId: string, permission: 'view' | 'edit') {
  const { error } = await supabase
    .from('api_request_shares')
    .insert({
      owner_id: userId,
      target_user_id: targetUserId,
      api_id: apiId,
      request_id: requestId,
      permission
    })

  if (error) throw error
}