import { supabase } from '@/lib/supabase'

export type NotificationType =
  | 'comment_created'
  | 'mention_added'
  | 'attachment_added'
  | 'status_changed'
  | 'priority_changed'
  | 'deadline_set'
  | 'deadline_cleared'
  | 'flag_added'
  | 'flag_removed'
  | 'version_created'
  | 'subtask_assigned'
  | 'subtask_completed'
  | 'checklist_item_assigned'
  | 'checklist_item_completed'
  | 'ownership_transferred'
  | 'sla_breached'
  | 'expiration_triggered'
  | 'webhook_failed'
  | 'webhook_succeeded'

export async function createNotification(
  userId: string,
  requestId: string,
  type: NotificationType,
  payload: any = {}
) {
  const { error } = await supabase
    .from('api_request_notifications')
    .insert({
      user_id: userId,
      request_id: requestId,
      type,
      payload
    })

  if (error) throw error
}
