'use server'

import { supabase } from '@/lib/supabase'
import { validateKey } from './validate-key'
import { recordTransaction } from './record-transaction'

export async function runRequest(apiId: string, input: any, key: string) {
  const owner = await validateKey(key)
  if (!owner) {
    throw new Error('Invalid API key')
  }

  const { data: api } = await supabase
    .from('apis')
    .select('*')
    .eq('id', apiId)
    .single()

  if (!api) throw new Error('API not found')

  const res = await fetch(api.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const output = await res.json()

  await supabase.from('requests').insert({
    api_id: apiId,
    input,
    output,
    owner_id: owner,
  })

  await recordTransaction(apiId, owner, api.price_per_request)

  return output
}
