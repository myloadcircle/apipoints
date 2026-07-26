'use server'

import { supabase } from '@/lib/supabase'

export async function addChangelog(apiId: string, version: string, title: string, body: string) {
  const { error } = await supabase
    .from('api_changelog')
    .insert({
      api_id: apiId,
      version,
      title,
      body,
    })

  if (error) throw new Error(error.message)
}

export async function listChangelog(apiId: string) {
  const { data, error } = await supabase
    .from('api_changelog')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
