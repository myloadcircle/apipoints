'use server'

import { supabase } from '@/lib/supabase'

export async function logWebhookDelivery(webhookId: string, status: string, response: any) {
  const { error } = await supabase
    .from('api_webhook_logs')
    .insert({
      webhook_id: webhookId,
      status,
      response,
    })

  if (error) throw new Error(error.message)
}

export async function listWebhookLogs(apiId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_webhook_logs')
    .select('*, api_webhooks(event, url)')
    .eq('api_webhooks.api_id', apiId)
    .eq('api_webhooks.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
