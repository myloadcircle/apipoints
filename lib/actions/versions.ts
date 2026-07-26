'use server'

import { supabase } from '@/lib/supabase'

export async function listVersions(apiId: string) {
  const { data, error } = await supabase
    .from('api_versions')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function addVersion(apiId: string, version: string, endpoint: string) {
  const { error } = await supabase
    .from('api_versions')
    .insert({
      api_id: apiId,
      version,
      endpoint,
    })

  if (error) throw new Error(error.message)
}
