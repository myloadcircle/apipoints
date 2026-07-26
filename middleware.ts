import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function middleware(req: any) {
  const token = req.cookies.get('sb-access-token')?.value

  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('https://APIPoints.site/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
