'use server'

import { supabase } from '@/lib/supabase'

export async function createGroup(userId: string, apiId: string, name: string) {
  const { error } = await supabase
    .from('api_request_groups')
    .insert({
      user_id: userId,
      api_id: apiId,
      name,
    })

  if (error) throw new Error(error.message)
}

export async function listGroups(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_request_groups')
    .select('*')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function assignRequestToGroup(userId: string, apiId: string, requestId: string, groupId: string) {
  const { error } = await supabase
    .from('api_request_group_items')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      group_id: groupId,
    })

  if (error) throw new Error(error.message)
}

export async function listGroupItems(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_group_items')
    .select('*, request:request_id(payload, created_at)')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
