import { supabase } from '@/lib/supabase'

export async function markAsRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('api_request_notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('api_request_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}
