import { supabase } from '@/lib/supabase'

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const { error } = await supabase
    .from('api_request_checklist_items')
    .update({ completed })
    .eq('id', itemId)

  if (error) throw error
}