import { supabase } from '@/lib/supabase'

export async function listDependencies(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_dependencies')
    .select('*, parent:depends_on(payload, status)')
    .eq('request_id', requestId)
    .eq('user_id', userId)

  if (error) throw error
  return data
}