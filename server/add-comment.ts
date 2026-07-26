import { supabase } from '@/lib/supabase'

export async function addComment(userId: string, apiId: string, requestId: string, message: string, parentId: string | null = null) {
  const { error } = await supabase
    .from('api_request_comments')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      message,
      parent_id: parentId
    })

  if (error) throw error
}