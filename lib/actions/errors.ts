'use server'

import { supabase } from '@/lib/supabase'

export async function logError(apiId: string, error: any, userId?: string) {
  const { message, stack } = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error), stack: null }

  const { error: insertError } = await supabase
    .from('api_errors')
    .insert({
      api_id: apiId,
      message,
      stack,
      user_id: userId,
    })

  if (insertError) throw new Error(insertError.message)
}

export async function listErrors(apiId: string) {
  const { data, error } = await supabase
    .from('api_errors')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}