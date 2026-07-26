import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function getUserOrRedirect() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('https://APIPoints.site/login', 'http://localhost:3000'))
  }

  return session.user
}
