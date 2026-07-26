import { supabase } from '@/lib/supabase'

export async function toggleSubtask(userId: string, subtaskId: string, completed: boolean) {
  const { error } = await supabase
    .from('api_request_subtasks')
    .update({ completed })
    .eq('id', subtaskId)
    .eq('user_id', userId)

  if (error) throw error
}