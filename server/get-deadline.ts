import { supabase } from '@/lib/supabase'

export async function getDeadline(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_deadlines')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}