import { supabase } from '@/lib/supabase'

export async function listNotifications(userId: string, includeRead: boolean = false) {
  let query = supabase
    .from('api_request_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!includeRead) {
    query = query.eq('read', false)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('api_request_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return count || 0
}
