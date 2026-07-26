import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/actions/rate-limit-v2'

export async function middleware(req: any) {
  const userId = req.headers.get('x-user-id')
  const apiId = req.headers.get('x-api-id')
  const requestId = req.headers.get('x-request-id')

  if (userId && apiId && requestId) {
    try {
      await enforceRateLimit(userId, apiId, requestId)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Rate limit exceeded' },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
