import { NextRequest, NextResponse } from 'next/server'
import { createAPIKey } from '@/lib/actions/api-keys'

export async function POST(req: NextRequest) {
  try {
    const { ownerId, keyName } = await req.json()
    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'ownerId is required' }, { status: 400 })
    }
    const key = await createAPIKey(ownerId, keyName)
    return NextResponse.json({ success: true, data: key })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
