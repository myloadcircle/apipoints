import { supabase } from '@/lib/supabase'

export function diffPayloads(a: any, b: any) {
  const out: any[] = []
  const seen = new Set<string>()
  const allKeys: string[] = []

  for (const k of [...Object.keys(a || {}), ...Object.keys(b || {})]) {
    if (!seen.has(k)) {
      seen.add(k)
      allKeys.push(k)
    }
  }

  for (const k of allKeys) {
    const av = a?.[k]
    const bv = b?.[k]

    if (JSON.stringify(av) !== JSON.stringify(bv)) {
      out.push({ key: k, left: av, right: bv })
    }
  }

  return out
}

export async function createVersion(userId: string, apiId: string, requestId: string) {
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .select('payload')
    .eq('id', requestId)
    .single()

  if (reqError) throw reqError

  const { error } = await supabase
    .from('api_request_versions')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      payload: request.payload,
      status: 'version_created'
    })

  if (error) throw error
}

export async function listVersions(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_versions')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
