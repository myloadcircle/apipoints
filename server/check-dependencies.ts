import { supabase } from '@/lib/supabase'

export async function checkDependenciesSatisfied(requestId: string, userId: string) {
  const { data } = await supabase
    .from('api_request_dependencies')
    .select('*, parent:depends_on(status)')
    .eq('request_id', requestId)
    .eq('user_id', userId)

  if (!data || data.length === 0) return true

  return data.every((d: any) => d.parent?.status === 'completed')
}