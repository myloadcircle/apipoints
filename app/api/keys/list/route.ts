import { NextRequest, NextResponse } from 'next/server'
import { listAPIKeys } from '@/lib/actions/api-keys'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ownerId = searchParams.get('ownerId')
    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'ownerId is required' }, { status: 400 })
    }
    const keys = await listAPIKeys(ownerId)
    return NextResponse.json({ success: true, data: keys })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
