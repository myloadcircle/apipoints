import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateKey, userId } = body

    if (!templateKey || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const WORKFLOW_TEMPLATES = {
      research_pipeline: {
        name: 'Research Pipeline',
        steps: ['researcher', 'analyst', 'writer']
      },
      content_pipeline: {
        name: 'Content Pipeline',
        steps: ['researcher', 'writer']
      },
      coding_pipeline: {
        name: 'Coding Pipeline',
        steps: ['researcher', 'coder', 'analyst']
      }
    }

    const template = WORKFLOW_TEMPLATES[templateKey as keyof typeof WORKFLOW_TEMPLATES]
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create workflow
    const { data: wf, error: wfError } = await supabase
      .from('workflows')
      .insert({ user_id: userId, name: template.name })
      .select()
      .single()

    if (wfError) throw new Error(`Failed to create workflow: ${wfError.message}`)

    // Get agents for each step
    for (let i = 0; i < template.steps.length; i++) {
      const role = template.steps[i]

      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .limit(1)

      if (agents && agents.length > 0) {
        await supabase
          .from('workflow_steps')
          .insert({
            workflow_id: wf.id,
            agent_id: agents[0].id,
            step_order: i + 1
          })
      }
    }

    return NextResponse.json({ success: true, data: wf })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
