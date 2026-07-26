import { NextRequest, NextResponse } from 'next/server'
import { revokeAPIKey } from '@/lib/actions/api-keys'

export async function POST(req: NextRequest) {
  try {
    const { keyId } = await req.json()
    if (!keyId) {
      return NextResponse.json({ success: false, error: 'keyId is required' }, { status: 400 })
    }
    const result = await revokeAPIKey(keyId)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
