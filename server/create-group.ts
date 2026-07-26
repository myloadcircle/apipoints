import { supabase } from '@/lib/supabase'

export async function createGroup(userId: string, apiId: string, name: string) {
  const { error } = await supabase
    .from('api_request_groups')
    .insert({
      user_id: userId,
      api_id: apiId,
      name
    })

  if (error) throw error
}