import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sharedAgentId, rating, review, userId } = body

    if (!sharedAgentId || !rating || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('agent_ratings')
      .insert({
        shared_agent_id: sharedAgentId,
        user_id: userId,
        rating,
        review
      })

    if (error) throw new Error(`Failed to rate agent: ${error.message}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
