import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const includeRead = req.nextUrl.searchParams.get('includeRead') === 'true'

  try {
    const { data, error } = await supabase
      .from('api_request_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (includeRead === false) {
      data?.filter(n => n.read === false)
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unread count
    const { count, error: countError } = await supabase
      .from('api_request_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    return NextResponse.json({
      notifications: data || [],
      unreadCount: count || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID' // Get from auth in production
  const body = await req.json()
  const { action } = body

  try {
    if (action === 'mark-read') {
      const { notificationId } = body
      const { error } = await supabase
        .from('api_request_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'mark-all-read') {
      const { error } = await supabase
        .from('api_request_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
