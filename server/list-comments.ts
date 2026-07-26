import { supabase } from '@/lib/supabase'

export async function listComments(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_comments')
    .select('*, replies:api_request_comments!parent_id(*)')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}