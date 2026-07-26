'use server'

import { supabase } from '@/lib/supabase'
import { recordBillingEvent } from './billing-events'
import { triggerWebhooksWithLogging } from './trigger-webhooks-with-logging'

export async function billForOverage(userId: string, apiId: string, requestId: string) {
  const { data: api } = await supabase
    .from('apis')
    .select('overage_price')
    .eq('id', apiId)
    .single()

  if (!api || !api.overage_price) return

  await recordBillingEvent(userId, apiId, requestId, api.overage_price)

  await triggerWebhooksWithLogging(apiId, 'billing.overage', {
    user_id: userId,
    api_id: apiId,
    request_id: requestId,
    cost: api.overage_price,
  })
}
