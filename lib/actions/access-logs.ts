'use server'

import { supabase } from '@/lib/supabase'

export async function listLogs(apiId: string) {
  const { data, error } = await supabase
    .from('api_logs')
    .select('*')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function addLog(apiId: string, input: any, output: any, userId?: string) {
  const { error } = await supabase
    .from('api_logs')
    .insert({
      api_id: apiId,
      input,
      output,
      user_id: userId,
    })

  if (error) throw new Error(error.message)
}
