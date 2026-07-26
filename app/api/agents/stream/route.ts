import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, input, userId } = body

    if (!agentId || !input || !userId) {
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

    // Calculate burn
    const { calculateBurn } = await import('@/lib/actions/credits')
    const burn = calculateBurn({ providers: 1, retries: 0, fallbacks: 0 })

    // Burn credits
    const { burnCredits } = await import('@/lib/actions/credits')
    await burnCredits(userId, burn, 'agent_call', { agentId, input })

    // Mock streaming response (replace with actual OpenAI in production)
    const mockResponse = `Mock streaming response from ${agent.name} for: ${input}`

    // Log execution
    await supabase
      .from('agent_logs')
      .insert({
        user_id: userId,
        agent_name: agent.name,
        input,
        output: mockResponse,
        credits_burned: burn
      })

    return NextResponse.json({ output: mockResponse })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
