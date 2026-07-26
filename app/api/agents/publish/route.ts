import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, userId } = body

    if (!agentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get agent
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Publish to shared_agents
    const { data, error: publishError } = await supabase
      .from('shared_agents')
      .insert({
        creator_id: userId,
        name: agent.name,
        role: agent.role,
        system_prompt: agent.system_prompt
      })
      .select()
      .single()

    if (publishError) throw new Error(`Failed to publish: ${publishError.message}`)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
