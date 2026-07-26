'use server'

import { supabase } from '@/lib/supabase'

export async function listTags(apiId: string) {
  const { data, error } = await supabase
    .from('api_tags')
    .select('tag')
    .eq('api_id', apiId)

  if (error) throw new Error(error.message)
  return data?.map((t: any) => t.tag) || []
}

export async function addTag(apiId: string, tag: string) {
  const { error } = await supabase
    .from('api_tags')
    .insert({ api_id: apiId, tag })

  if (error) throw new Error(error.message)
}
