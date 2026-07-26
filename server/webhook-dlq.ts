import { supabase } from '@/lib/supabase'
import { logActivity } from './log-activity'
import { createNotification } from './create-notification'

/**
 * Move failed job to Dead Letter Queue
 */
export async function moveToDeadLetterQueue(
  job: any,
  finalStatusCode: number | null,
  finalError: string
) {
  // Insert into DLQ
  const { data, error } = await supabase
    .from('api_webhook_dead_letter_queue')
    .insert({
      original_queue_id: job.id,
      request_id: job.request_id,
      webhook_id: job.webhook_id,
      payload: job.payload,
      headers: job.headers,
      url: job.url,
      method: job.method || 'POST',
      final_status_code: finalStatusCode,
      final_error_message: finalError,
      attempts_made: job.attempt_number
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to move job to DLQ')
  }

  // Log activity
  await logActivity(
    'system',
    job.request_id || '',
    'webhook_moved_to_dlq',
    {
      webhook_id: job.webhook_id,
      dlq_id: data.id,
      attempts_made: job.attempt_number,
      final_error: finalError
    }
  )

  // Notify owner
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', job.webhook_id)
    .single()

  if (webhook?.user_id) {
    await createNotification(
      webhook.user_id,
      job.request_id || '',
      'webhook_failed',
      {
        webhook_id: job.webhook_id,
        dlq_id: data.id,
        reason: 'moved_to_dlq'
      }
    )
  }

  return data
}

/**
 * Replay DLQ item (move back to outbound queue)
 */
export async function replayFromDLQ(dlqId: string, userId: string) {
  // Get DLQ item
  const { data: dlqItem, error: dlqError } = await supabase
    .from('api_webhook_dead_letter_queue')
    .select('*')
    .eq('id', dlqId)
    .single()

  if (dlqError || !dlqItem) {
    throw new Error('DLQ item not found')
  }

  // Verify ownership
  const { data: webhook, error: whError } = await supabase
    .from('api_request_webhooks')
    .select('user_id')
    .eq('id', dlqItem.webhook_id)
    .single()

  if (whError || webhook?.user_id !== userId) {
    throw new Error('Unauthorized')
  }

  // Move back to outbound queue
  const { data: queueItem, error: queueError } = await supabase
    .from('api_webhook_outbound_queue')
    .insert({
      request_id: dlqItem.request_id,
      webhook_id: dlqItem.webhook_id,
      payload: dlqItem.payload,
      headers: dlqItem.headers,
      url: dlqItem.url,
      method: dlqItem.method,
      attempt_number: 1,
      scheduled_at: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single()

  if (queueError) {
    throw new Error('Failed to replay from DLQ')
  }

  // Delete from DLQ
  await supabase
    .from('api_webhook_dead_letter_queue')
    .delete()
    .eq('id', dlqId)

  // Log activity
  await logActivity(
    userId,
    dlqItem.request_id || '',
    'webhook_dlq_replayed',
    {
      webhook_id: dlqItem.webhook_id,
      dlq_id: dlqId,
      new_queue_id: queueItem.id
    }
  )

  return queueItem
}

/**
 * Delete DLQ item
 */
export async function deleteDLQItem(dlqId: string, userId: string) {
  // Verify ownership
  const { data: dlqItem, error: dlqError } = await supabase
    .from('api_webhook_dead_letter_queue')
    .select('*, webhook:webhook_id(user_id)')
    .eq('id', dlqId)
    .single()

  if (dlqError || !dlqItem || dlqItem.webhook?.user_id !== userId) {
    throw new Error('Unauthorized or not found')
  }

  const { error } = await supabase
    .from('api_webhook_dead_letter_queue')
    .delete()
    .eq('id', dlqId)

  if (error) {
    throw new Error('Failed to delete DLQ item')
  }

  // Log activity
  await logActivity(
    userId,
    dlqItem.request_id || '',
    'webhook_dlq_deleted',
    {
      webhook_id: dlqItem.webhook_id,
      dlq_id: dlqId
    }
  )
}

/**
 * Get DLQ items for user
 */
export async function getDLQItems(userId: string) {
  // Get user's webhooks
  const { data: webhooks } = await supabase
    .from('api_request_webhooks')
    .select('id')
    .eq('user_id', userId)

  const webhookIds = webhooks?.map(wh => wh.id) || []

  if (webhookIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('api_webhook_dead_letter_queue')
    .select('*')
    .in('webhook_id', webhookIds)
    .order('moved_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch DLQ items')
  }

  return data || []
}
