import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, userId } = body

    if (!name || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ owner_id: userId, name })
      .select()
      .single()

    if (teamError) throw new Error(`Failed to create team: ${teamError.message}`)

    // Add owner as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) throw new Error(`Failed to add team member: ${memberError.message}`)

    return NextResponse.json({ success: true, data: team })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
