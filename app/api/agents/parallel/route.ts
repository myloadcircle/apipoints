import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentIds, input, userId } = body

    if (!agentIds || !Array.isArray(agentIds) || !input || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const results = []

    for (const agentId of agentIds) {
      // Get agent
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', userId)
        .single()

      if (!agent) continue

      // Calculate burn
      const { calculateBurn } = await import('@/lib/actions/credits')
      const burn = calculateBurn({ providers: 1, retries: 0, fallbacks: 0 })

      // Burn credits
      const { burnCredits } = await import('@/lib/actions/credits')
      await burnCredits(userId, burn, 'agent_call', { agentId, input })

      // Mock response
      const output = `Mock response from ${agent.name} for: ${input}`

      // Log execution
      await supabase
        .from('agent_logs')
        .insert({
          user_id: userId,
          agent_name: agent.name,
          input,
          output,
          credits_burned: burn
        })

      results.push({ agentId, output })
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
