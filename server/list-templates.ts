import { supabase } from '@/lib/supabase'

export async function listTemplates(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_request_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}