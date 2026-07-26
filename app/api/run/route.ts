import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateKey } from '@/lib/actions/validate-key'
import { recordTransaction } from '@/lib/actions/record-transaction'
import { enforceRateLimit } from '@/lib/actions/enforce-rate-limit'

export async function POST(req: Request) {
  const { api_id, input } = await req.json()
  const key = req.headers.get('x-api-key')

  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const owner = await validateKey(key)
  if (!owner) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
  }

  const limitCheck = await enforceRateLimit(owner, api_id)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded: ' + limitCheck.reason },
      { status: 429 }
    )
  }

  const { data: api } = await supabase
    .from('apis')
    .select('*')
    .eq('id', api_id)
    .single()

  if (!api) {
    return NextResponse.json({ error: 'API not found' }, { status: 404 })
  }

  try {
    const res = await fetch(api.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const output = await res.json()

    await supabase.from('requests').insert({
      api_id,
      input,
      output,
      owner_id: owner,
    })

    await recordTransaction(api_id, owner, api.price_per_request)

    return NextResponse.json({ output })
  } catch (error) {
    // Log error
    await supabase.from('api_errors').insert({
      api_id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      user_id: owner,
    })
    throw error
  }
}
