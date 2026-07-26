'use server'

import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function createAccessToken(userId: string, apiId: string, label: string, scopes: string[]) {
  const token = crypto.randomBytes(32).toString('hex')

  const { error } = await supabase
    .from('api_tokens')
    .insert({
      user_id: userId,
      api_id: apiId,
      label,
      token,
      scopes,
    })

  if (error) throw new Error(error.message)

  return token
}

export async function listTokens(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, label, scopes, created_at')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function revokeToken(tokenId: string, userId: string) {
  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
