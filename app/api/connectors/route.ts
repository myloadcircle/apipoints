import { executeConnector } from '@/lib/actions/connectors'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { connector_id, input, user_id, tenant_id } = body

  if (!connector_id || !input) {
    return NextResponse.json(
      { error: 'connector_id and input are required' },
      { status: 400 }
    )
  }

  try {
    const result = await executeConnector(
      connector_id,
      user_id || 'anonymous',
      tenant_id || null,
      input
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const entityId = searchParams.get('entity_id')

  try {
    const { queryNormalizedData } = await import('@/lib/actions/connectors')
    const data = await queryNormalizedData(type || '', entityId || undefined)

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
