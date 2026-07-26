import { NextRequest, NextResponse } from 'next/server'
import { createSubscriptionSession } from '@/lib/actions/credits'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tier, userId } = body

    if (!tier || !userId) {
      return NextResponse.json({ error: 'Missing tier or userId' }, { status: 400 })
    }

    const url = await createSubscriptionSession(userId, tier)
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
