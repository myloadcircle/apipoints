import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { teamId, ...policies } = body

    if (!teamId) {
      return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })
    }

    // Check if policy exists
    const { data: existing } = await supabase
      .from('org_policies')
      .select('id')
      .eq('team_id', teamId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('org_policies')
        .update(policies)
        .eq('team_id', teamId)

      if (error) throw new Error(`Failed to update: ${error.message}`)
    } else {
      const { error } = await supabase
        .from('org_policies')
        .insert({ team_id: teamId, ...policies })

      if (error) throw new Error(`Failed to create: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
