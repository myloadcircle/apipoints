import { supabase } from '@/lib/supabase'

export async function restoreVersion(userId: string, apiId: string, requestId: string, versionId: string) {
  const { data: v, error: vErr } = await supabase
    .from('api_request_versions')
    .select('*')
    .eq('id', versionId)
    .eq('user_id', userId)
    .single()

  if (vErr) throw vErr

  const { error: updateErr } = await supabase
    .from('requests')
    .update({ payload: v.payload, status: 'version_restored' })
    .eq('id', requestId)

  if (updateErr) throw updateErr
}