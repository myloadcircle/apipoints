import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId

  try {
    const { data, error } = await supabase
      .from('api_request_webhooks')
      .select('preferred_region, failover_regions, region_strategy')
      .eq('id', webhookId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({ config: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const body = await req.json()

  try {
    const { error } = await supabase
      .from('api_request_webhooks')
      .update({
        preferred_region: body.preferred_region,
        failover_regions: body.failover_regions,
        region_strategy: body.region_strategy
      })
      .eq('id', webhookId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
