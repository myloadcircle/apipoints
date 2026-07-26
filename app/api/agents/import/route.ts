import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sharedAgentId, userId } = body

    if (!sharedAgentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get shared agent
    const { data: shared, error } = await supabase
      .from('shared_agents')
      .select('*')
      .eq('id', sharedAgentId)
      .single()

    if (error || !shared) {
      return NextResponse.json({ error: 'Shared agent not found' }, { status: 404 })
    }

    // Import to user's agents
    const { data, error: importError } = await supabase
      .from('agents')
      .insert({
        user_id: userId,
        name: shared.name,
        role: shared.role,
        system_prompt: shared.system_prompt
      })
      .select()
      .single()

    if (importError) throw new Error(`Failed to import: ${importError.message}`)

    // Track import
    await supabase
      .from('imported_agents')
      .insert({
        user_id: userId,
        shared_agent_id: sharedAgentId
      })

    // Increment downloads
    await supabase
      .from('shared_agents')
      .update({ downloads: (shared.downloads || 0) + 1 })
      .eq('id', sharedAgentId)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
