import { supabase } from '@/lib/supabase'

export async function createLink(userId: string, apiId: string, fromId: string, toId: string, label: string) {
  const { error } = await supabase
    .from('api_request_links')
    .insert({
      user_id: userId,
      api_id: apiId,
      from_request: fromId,
      to_request: toId,
      label
    })

  if (error) throw error
}