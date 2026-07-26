'use server'

import { supabase } from '@/lib/supabase'

export async function createLabel(userId: string, apiId: string, name: string, color: string) {
  const { error } = await supabase
    .from('api_request_labels')
    .insert({
      user_id: userId,
      api_id: apiId,
      name,
      color,
    })

  if (error) throw new Error(error.message)
}

export async function listLabels(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_request_labels')
    .select('*')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function assignLabel(userId: string, apiId: string, requestId: string, labelId: string) {
  const { error } = await supabase
    .from('api_request_label_items')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      label_id: labelId,
    })

  if (error) throw new Error(error.message)
}

export async function listLabelsForRequest(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_label_items')
    .select('*, label:label_id(name, color)')
    .eq('request_id', requestId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data || []
}
