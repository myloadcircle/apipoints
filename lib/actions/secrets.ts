'use server'

import { supabase } from '@/lib/supabase'

export async function addSecret(userId: string, apiId: string, name: string, value: string) {
  const { error } = await supabase
    .from('api_secrets')
    .insert({
      user_id: userId,
      api_id: apiId,
      name,
      value,
    })

  if (error) throw new Error(error.message)
}

export async function listSecrets(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_secrets')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getSecretValue(secretId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_secrets')
    .select('value')
    .eq('id', secretId)
    .eq('user_id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data?.value
}
