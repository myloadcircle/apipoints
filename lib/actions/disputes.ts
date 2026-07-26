'use server'

import { supabase } from '@/lib/supabase'

export async function listDisputesForCreator(ownerId: string) {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*, users(email), apis(name)')
    .eq('api_owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function resolveDispute(refundId: string, status: 'approved' | 'rejected') {
  const { error } = await supabase
    .from('refund_requests')
    .update({ status })
    .eq('id', refundId)

  if (error) throw new Error(error.message)
}
