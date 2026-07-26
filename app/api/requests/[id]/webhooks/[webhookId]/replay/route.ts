import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { replayWebhook } from '@/server/replay-webhook'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; webhookId: string } }
) {
  const requestId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    const body = await req.json().catch(() => ({}))
    const { originalLogId } = body

    // Verify ownership
    const { data: request } = await supabase
      .from('requests')
      .select('user_id')
      .eq('id', requestId)
      .single()

    if (!request || request.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const result = await replayWebhook(userId, requestId, webhookId, originalLogId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
