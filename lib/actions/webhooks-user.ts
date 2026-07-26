'use server'

import { supabase } from '@/lib/supabase'

export async function addWebhook(apiId: string, userId: string, url: string, event: string) {
  const { error } = await supabase
    .from('api_webhooks')
    .insert({
      api_id: apiId,
      user_id: userId,
      url,
      event,
    })

  if (error) throw new Error(error.message)
}

export async function listWebhooks(apiId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_webhooks')
    .select('*')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function triggerWebhooks(apiId: string, event: string, payload: any) {
  const { data: hooks } = await supabase
    .from('api_webhooks')
    .select('*')
    .eq('api_id', apiId)
    .eq('event', event)

  for (const hook of hooks || []) {
    fetch(hook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }
}
