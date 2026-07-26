import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      console.log('Team top-up completed:', event.data?.object?.id)
    }

    if (event.type === 'invoice.payment_succeeded') {
      console.log('Team subscription payment:', event.data?.object?.id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
