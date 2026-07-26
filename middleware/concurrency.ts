import { NextResponse } from 'next/server'
import { enforceConcurrency } from '@/lib/actions/concurrency'

export async function middleware(req: any) {
  const userId = req.headers.get('x-user-id')
  const apiId = req.headers.get('x-api-id')

  if (userId && apiId) {
    try {
      await enforceConcurrency(userId, apiId)
    } catch (error: any) {
      return NextResponse.json(
        JSON.stringify({ error: 'Too many concurrent requests' }),
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
