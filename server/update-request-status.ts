import { supabase } from '@/lib/supabase'
import { logStatusChange } from '@/server/log-status-change'

export async function updateRequestStatus(userId: string, apiId: string, requestId: string, newStatus: string) {
  const { data: existing, error: fetchErr } = await supabase
    .from('requests')
    .select('status')
    .eq('id', requestId)
    .single()

  if (fetchErr) throw fetchErr

  const oldStatus = existing.status

  const { error: updateErr } = await supabase
    .from('requests')
    .update({ status: newStatus })
    .eq('id', requestId)

  if (updateErr) throw updateErr

  await logStatusChange(userId, apiId, requestId, oldStatus, newStatus)
}