import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { replayFromDLQ, deleteDLQItem } from '@/server/webhook-dlq'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const dlqId = params.id

  try {
    const { data, error } = await supabase
      .from('api_webhook_dead_letter_queue')
      .select('*')
      .eq('id', dlqId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'DLQ item not found' }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const dlqId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production

  try {
    await deleteDLQItem(dlqId, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const dlqId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const body = await req.json()
  const action = body.action

  try {
    if (action === 'replay') {
      const result = await replayFromDLQ(dlqId, userId)
      return NextResponse.json({ success: true, queueItem: result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
