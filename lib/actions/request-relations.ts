'use server'

import { supabase } from '@/lib/supabase'

export async function linkRequests(userId: string, apiId: string, parentId: string, childId: string) {
  const { error } = await supabase
    .from('api_request_relations')
    .insert({
      user_id: userId,
      api_id: apiId,
      parent_id: parentId,
      child_id: childId,
    })

  if (error) throw new Error(error.message)
}

export async function listRelations(apiId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_relations')
    .select('*, parent:parent_id(payload, created_at), child:child_id(payload, created_at)')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
