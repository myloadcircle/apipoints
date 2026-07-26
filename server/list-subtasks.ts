import { supabase } from '@/lib/supabase'

export async function listSubtasks(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_subtasks')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}