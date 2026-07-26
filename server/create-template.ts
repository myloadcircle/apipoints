import { supabase } from '@/lib/supabase'

export async function createTemplate(userId: string, apiId: string, name: string, payload: any) {
  const { error } = await supabase
    .from('api_request_templates')
    .insert({
      user_id: userId,
      api_id: apiId,
      name,
      payload
    })

  if (error) throw error
}