import { supabase } from '@/lib/supabase'

export async function transferOwnership(currentUserId: string, apiId: string, requestId: string, newOwnerId: string) {
  const { error } = await supabase
    .from('requests')
    .update({
      user_id: newOwnerId,
      status: 'ownership_transferred'
    })
    .eq('id', requestId)
    .eq('user_id', currentUserId)

  if (error) throw error

  const { error: logErr } = await supabase
    .from('api_request_ownership_transfers')
    .insert({
      from_user_id: currentUserId,
      to_user_id: newOwnerId,
      api_id: apiId,
      request_id: requestId
    })

  if (logErr) throw logErr
}