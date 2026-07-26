import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, role, systemPrompt, userId } = body

    if (!name || !role || !systemPrompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: userId,
        name,
        role,
        system_prompt: systemPrompt
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create agent: ${error.message}`)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
