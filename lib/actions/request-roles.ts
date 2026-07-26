'use server'

import { supabase } from '@/lib/supabase'

export async function setRequestRole(userId: string, apiId: string, requestId: string, role: string) {
  const { error } = await supabase
    .from('api_request_roles')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      role,
    })

  if (error) throw new Error(error.message)
}

export async function listRolesForRequest(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_roles')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
