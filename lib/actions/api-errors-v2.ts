'use server'

import { supabase } from '@/lib/supabase'

export async function logAPIError(apiId: string, userId: string, requestId: string, error: any) {
  const { message, stack } = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error), stack: null }

  const { error: dbError } = await supabase
    .from('api_errors')
    .insert({
      api_id: apiId,
      user_id: userId,
      request_id: requestId,
      message,
      stack,
    })

  if (dbError) throw new Error(dbError.message)
}

export async function listAPIErrors(apiId: string) {
  const { data, error } = await supabase
    .from('api_errors')
    .select('*, users(email)')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
