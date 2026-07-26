'use server'

import { supabase } from '@/lib/supabase'
import { logWebhookDelivery } from './webhook-logs'

export async function triggerWebhooksWithLogging(apiId: string, event: string, payload: any) {
  const { data: hooks } = await supabase
    .from('api_webhooks')
    .select('*')
    .eq('api_id', apiId)
    .eq('event', event)

  for (const hook of hooks || []) {
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()

      await logWebhookDelivery(hook.id, 'success', {
        status: res.status,
        body: text,
      })
    } catch (err: any) {
      await logWebhookDelivery(hook.id, 'failed', {
        error: err.message || String(err),
      })
    }
  }
}
