import { supabase } from '@/lib/supabase'

export async function createChecklist(userId: string, apiId: string, requestId: string, title: string) {
  const { data, error } = await supabase
    .from('api_request_checklists')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      title
    })
    .select()
    .single()

  if (error) throw error
  return data
}