import { supabase } from '@/lib/supabase'

export interface CreditLedger {
  id: string
  user_id: string
  credits_remaining: number
  credits_used: number
  last_updated: string
}

export interface UsageEvent {
  id: string
  user_id: string
  event_type: string
  credits_burned: number
  created_at: string
  metadata?: any
}

export const SUBSCRIPTION_PLANS = {
  starter: { credits: 1000000, price: 1999, name: 'Starter', price_id: 'price_starter_1999' },
  pro: { credits: 5000000, price: 5999, name: 'Pro', price_id: 'price_pro_5999' },
  team: { credits: 20000000, price: 19900, name: 'Team', price_id: 'price_team_19900' }
}

/**
 * Get user credit balance
 */
export async function getCreditBalance(userId: string) {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error('Failed to fetch credit balance')
  return data || { credits_remaining: 0, credits_used: 0 }
}

/**
 * Add credits to user account
 */
export async function addCredits(userId: string, amount: number) {
  const { data: existing } = await supabase
    .from('credit_ledger')
    .select('id, credits_remaining')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('credit_ledger')
      .update({
        credits_remaining: existing.credits_remaining + amount,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to add credits: ${error.message}`)
    return data
  } else {
    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: userId,
        credits_remaining: amount,
        credits_used: 0
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create ledger: ${error.message}`)
    return data
  }
}

/**
 * Burn credits for usage
 */
export async function burnCredits(
  userId: string,
  amount: number,
  eventType: string,
  metadata?: any
) {
  // Check balance
  const balance = await getCreditBalance(userId)
  if (balance.credits_remaining < amount) {
    throw new Error('Insufficient credits')
  }

  // Update ledger
  const { error: ledgerError } = await supabase
    .from('credit_ledger')
    .update({
      credits_remaining: balance.credits_remaining - amount,
      credits_used: balance.credits_used + amount,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (ledgerError) throw new Error(`Failed to update ledger: ${ledgerError.message}`)

  // Log usage event
  const { error: eventError } = await supabase
    .from('usage_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      credits_burned: amount,
      metadata
    })

  if (eventError) console.error('Failed to log usage event:', eventError)
}

// Base cost per exchange call
const BASE_COST = 10;

// Provider call cost
const PROVIDER_COST = 25;

// Retry penalty
const RETRY_COST = 40;

// Fallback penalty
const FALLBACK_COST = 60;

// Final burn calculation
export function calculateBurn({ providers, retries, fallbacks }: { providers: number, retries: number, fallbacks: number }) {
  return (
    BASE_COST +
    providers * PROVIDER_COST +
    retries * RETRY_COST +
    fallbacks * FALLBACK_COST
  );
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateStripeCustomer(userId: string) {
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  // In production, create Stripe customer via Stripe API
  const stripeCustomerId = `cus_mock_${Date.now()}`

  const { data, error } = await supabase
    .from('stripe_customers')
    .insert({ user_id: userId, stripe_customer_id: stripeCustomerId })
    .select()
    .single()

  if (error) throw new Error(`Failed to create Stripe customer: ${error.message}`)
  return data
}

/**
 * Create PAYG top-up session (Stripe Checkout)
 */
export async function createTopUpSession(userId: string) {
  const customer = await getOrCreateStripeCustomer(userId)

  // In production, use actual Stripe SDK:
  // const session = await stripe.checkout.sessions.create({
  //   mode: "payment",
  //   customer: customer.stripe_customer_id,
  //   line_items: [{ price_data: { currency: "gbp", product_data: { name: "APIPoints PAYG Credits" }, unit_amount: 500 }, quantity: 1 }],
  //   success_url: "https://APIPoints.site/dashboard?topup=success",
  //   cancel_url: "https://APIPoints.site/dashboard?topup=cancel",
  // })

  // Mock session URL for now
  const mockSessionUrl = `https://APIPoints.site/dashboard?topup=success&session=mock_${Date.now()}`

  return mockSessionUrl
}

/**
 * Handle Stripe top-up webhook (mock implementation)
 */
export async function handleTopUpWebhook(stripePaymentId: string, userId: string, amount: number) {
  // Add 50,000 credits per £5
  const creditsToAdd = Math.floor((amount / 500) * 50000)

  const { error: ledgerError } = await supabase
    .from('credit_ledger')
    .update({
      credits_remaining: supabase.rpc('increment', { amount: creditsToAdd }),
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (ledgerError) throw new Error(`Failed to update ledger: ${ledgerError.message}`)

  const { error: paymentError } = await supabase
    .from('stripe_payments')
    .insert({
      user_id: userId,
      stripe_payment_id: stripePaymentId,
      amount,
      credits_added: creditsToAdd
    })

  if (paymentError) throw new Error(`Failed to log payment: ${paymentError.message}`)
}

/**
 * Create subscription session
 */
export async function createSubscriptionSession(userId: string, tier: 'starter' | 'pro' | 'team') {
  const customer = await getOrCreateStripeCustomer(userId)
  const plan = SUBSCRIPTION_PLANS[tier]

  // In production, use actual Stripe SDK:
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   customer: customer.stripe_customer_id,
  //   line_items: [{ price: SUBSCRIPTION_PLANS[tier].price_id, quantity: 1 }],
  //   success_url: "https://APIPoints.site/dashboard?sub=success",
  //   cancel_url: "https://APIPoints.site/dashboard?sub=cancel",
  // })

  // Mock session URL for now
  const mockSessionUrl = `https://APIPoints.site/dashboard?sub=success&tier=${tier}&session=mock_${Date.now()}`

  return mockSessionUrl
}

/**
 * Handle subscription webhook (mock implementation)
 */
export async function handleSubscriptionWebhook(stripePaymentId: string, userId: string, tier: string) {
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]
  if (!plan) throw new Error('Invalid subscription tier')

  const { error: ledgerError } = await supabase
    .from('credit_ledger')
    .update({
      credits_remaining: supabase.rpc('increment', { amount: plan.credits }),
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (ledgerError) throw new Error(`Failed to update ledger: ${ledgerError.message}`)

  await supabase
    .from('stripe_payments')
    .insert({
      user_id: userId,
      stripe_payment_id: stripePaymentId,
      amount: plan.price,
      credits_added: plan.credits
    })
}

/**
 * Expire old credits (cron job - run monthly)
 */
export async function expireOldCredits() {
  const { error } = await supabase
    .from('credit_ledger')
    .update({
      credits_remaining: 0,
      last_updated: new Date().toISOString()
    })
    .lt('last_updated', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (error) console.error('Failed to expire credits:', error)
}

/**
 * Get usage events
 */
export async function getUsageEvents(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('usage_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error('Failed to fetch usage events')
  return data || []
}
