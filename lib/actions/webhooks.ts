'use server'

import { supabase } from '@/lib/supabase'

export async function listWebhooks(ownerId: string) {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('owner_id', ownerId)

  if (error) throw new Error(error.message)
  return data || []
}

export async function addWebhook(ownerId: string, url: string, apiId?: string) {
  const { error } = await supabase
    .from('webhooks')
    .insert({ owner_id: ownerId, url, api_id: apiId })

  if (error) throw new Error(error.message)
}

export async function triggerWebhooks(apiId: string, payload: any) {
  const { data } = await supabase
    .from('webhooks')
    .select('url')
    .eq('api_id', apiId)

  if (!data) return

  for (const hook of data) {
    fetch(hook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Webhook failed:', err))
  }
}
