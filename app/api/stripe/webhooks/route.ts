import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    // In production, verify Stripe webhook signature
    // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)

    // Mock event for now
    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      // Handle top-up
      console.log('Processing top-up webhook')
    }

    if (event.type === 'invoice.payment_succeeded') {
      // Handle subscription payment
      console.log('Processing subscription webhook')
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
