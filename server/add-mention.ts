import { supabase } from '@/lib/supabase'

export async function addMention(userId: string, apiId: string, requestId: string, mentionedUserId: string, context: string) {
  const { error } = await supabase
    .from('api_request_mentions')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      mentioned_user_id: mentionedUserId,
      context
    })

  if (error) throw error
}