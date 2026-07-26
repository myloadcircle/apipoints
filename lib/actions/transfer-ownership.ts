'use server'

import { supabase } from '@/lib/supabase'

export async function transferRequestOwnership(requestId: string, fromUserId: string, toUserId: string) {
  // Verify ownership
  const { data: req, error: reqErr } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', fromUserId)
    .single()

  if (reqErr || !req) throw new Error('Request not found or access denied')

  // Transfer ownership
  const { error } = await supabase
    .from('requests')
    .update({ user_id: toUserId })
    .eq('id', requestId)

  if (error) throw new Error(error.message)

  // Log ownership transfer
  await supabase
    .from('api_request_ownership')
    .insert({
      request_id: requestId,
      from_user: fromUserId,
      to_user: toUserId,
    })
}

export async function listOwnershipHistory(requestId: string) {
  const { data, error } = await supabase
    .from('api_request_ownership')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
