import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('https://APIPoints.site/login', 'http://localhost:3000'))
}
