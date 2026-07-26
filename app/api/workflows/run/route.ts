import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workflowId, input, userId } = body

    if (!workflowId || !input || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get workflow steps
    const { data: steps, error } = await supabase
      .from('workflow_steps')
      .select('*, agents(*)')
      .eq('workflow_id', workflowId)
      .order('step_order', { ascending: true })

    if (error) throw new Error('Failed to fetch workflow steps')

    let output = input

    // Run each step
    for (const step of steps) {
      if (!step.agents) continue

      // Calculate burn
      const { calculateBurn } = await import('@/lib/actions/credits')
      const burn = calculateBurn({ providers: 1, retries: 0, fallbacks: 0 })

      // Burn credits
      const { burnCredits } = await import('@/lib/actions/credits')
      await burnCredits(userId, burn, 'agent_call', { agentId: step.agent_id, input: output })

      // Mock response (replace with actual OpenAI in production)
      output = `Step ${step.step_order} (${step.agents.name}): Processed "${output}"`

      // Log execution
      await supabase
        .from('agent_logs')
        .insert({
          user_id: userId,
          agent_name: step.agents.name,
          input: output,
          output,
          credits_burned: burn
        })
    }

    return NextResponse.json({ output })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
