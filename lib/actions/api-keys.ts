'use server'

import { randomBytes } from 'crypto'
import { supabase } from '@/lib/supabase'

export async function createAPIKey(ownerId: string, keyName?: string) {
  const key = `al_${randomBytes(24).toString('hex')}`

  const { data, error } = await supabase
    .from('api_keys')
    .insert({ owner_id: ownerId, key, key_name: keyName || null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listAPIKeys(ownerId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, key, key_name, created_at, last_used, active')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function revokeAPIKey(keyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .update({ active: false })
    .eq('id', keyId)

  if (error) throw new Error(error.message)
  return { success: true }
}
