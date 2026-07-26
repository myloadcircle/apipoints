import { supabase } from '@/lib/supabase'

export async function addChecklistItem(checklistId: string, text: string) {
  const { error } = await supabase
    .from('api_request_checklist_items')
    .insert({
      checklist_id: checklistId,
      text,
      completed: false
    })

  if (error) throw error
}