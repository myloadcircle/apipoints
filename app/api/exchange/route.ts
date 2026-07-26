import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { burnCredits, calculateBurn } from '@/lib/actions/credits'

const PROVIDERS: Record<string, Array<{
  name: string
  cost: number
  speed: 'fast' | 'medium' | 'slow'
  reliability: 'high' | 'medium' | 'low'
}>> = {
  company_check: [
    { name: "CompaniesHouse", cost: 0.00, speed: "fast", reliability: "high" },
    { name: "AltCompanyAPI", cost: 0.02, speed: "medium", reliability: "high" }
  ],
  vehicle_check: [
    { name: "DVLA", cost: 0.00, speed: "fast", reliability: "high" },
    { name: "VehicleScore", cost: 0.03, speed: "medium", reliability: "medium" },
    { name: "MyCarCheck", cost: 0.09, speed: "slow", reliability: "high" }
  ],
  identity_check: [
    { name: "GovID", cost: 0.00, speed: "fast", reliability: "high" },
    { name: "AltID", cost: 0.05, speed: "medium", reliability: "medium" }
  ],
  valuation: [
    { name: "ValuationAPI", cost: 0.05, speed: "fast", reliability: "medium" }
  ],
  tender_lookup: [
    { name: "TenderAPI", cost: 0.02, speed: "fast", reliability: "medium" }
  ],
  risk_score: [
    { name: "RiskAPI", cost: 0.03, speed: "fast", reliability: "medium" }
  ]
}

const PRICING_RULES: Record<string, number> = {
  company_check: 0.03,
  vehicle_check: 0.05,
  identity_check: 0.05,
  valuation: 0.10,
  tender_lookup: 0.05,
  risk_score: 0.05
}

function rankProviders(intent: string, preferences?: any) {
  const providers = PROVIDERS[intent]
  if (!providers) return []

  return providers.sort((a, b) => {
    // If preferences specify speed/cost/reliability, use that
    if (preferences?.speed === 'fast') {
      const speedOrder = { fast: 0, medium: 1, slow: 2 }
      return speedOrder[a.speed] - speedOrder[b.speed]
    }
    if (preferences?.cost === 'low') {
      return a.cost - b.cost
    }
    // Default: speed > cost > reliability
    const speedOrder = { fast: 0, medium: 1, slow: 2 }
    if (a.speed !== b.speed) return speedOrder[a.speed] - speedOrder[b.speed]
    if (a.cost !== b.cost) return a.cost - b.cost
    const relOrder = { high: 0, medium: 1, low: 2 }
    return relOrder[a.reliability] - relOrder[b.reliability]
  })
}

async function callProvider(providerName: string, intent: string, payload: any) {
  // Real provider HTTP calls
  const providerEndpoints: Record<string, string> = {
    CompaniesHouse: 'https://api.companieshouse.gov.uk',
    DVLA: 'https://driver-vehicle-licensing.api.gov.uk',
    VehicleScore: process.env.VEHICLE_SCORE_API || '',
    GovID: 'https://gov-id-verify.api.gov.uk',
    ValuationAPI: process.env.VALUATION_API || '',
    TenderAPI: process.env.TENDER_API || '',
    RiskAPI: process.env.RISK_API || ''
  }

  const endpoint = providerEndpoints[providerName]
  if (!endpoint) {
    throw new Error(`No endpoint configured for provider: ${providerName}`)
  }

  // Build request based on intent
  let requestUrl = endpoint
  let requestBody: any = undefined
  let method = 'GET'

  switch (intent) {
    case 'company_check':
      requestUrl = `${endpoint}/company/${payload.company_number}`
      break
    case 'vehicle_check':
      requestUrl = `${endpoint}/vehicle/${payload.vrm}`
      break
    case 'valuation':
      requestUrl = `${endpoint}/value`
      method = 'POST'
      requestBody = payload
      break
    default:
      if (payload) {
        method = 'POST'
        requestBody = payload
      }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

  try {
    const res = await fetch(requestUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getProviderKey(providerName)}`
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Provider ${providerName} returned ${res.status}`)
    }

    return await res.json()
  } catch (error: any) {
    clearTimeout(timeout)
    throw error
  }
}

function getProviderKey(providerName: string): string {
  const keys: Record<string, string> = {
    CompaniesHouse: process.env.COMPANIES_HOUSE_KEY || '',
    DVLA: process.env.DVLA_KEY || '',
    VehicleScore: process.env.VEHICLE_SCORE_KEY || '',
    GovID: process.env.GOV_ID_KEY || '',
    ValuationAPI: process.env.VALUATION_KEY || '',
    TenderAPI: process.env.TENDER_KEY || '',
    RiskAPI: process.env.RISK_KEY || ''
  }
  return keys[providerName] || ''
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const { intent, payload, preferences, user_id } = body

    if (!intent || !payload) {
      return NextResponse.json(
        { error: 'intent and payload are required' },
        { status: 400 }
      )
    }

    const providers = PROVIDERS[intent]
    if (!providers || providers.length === 0) {
      return NextResponse.json(
        { error: `No providers found for intent: ${intent}` },
        { status: 404 }
      )
    }

    // Rank providers
    const ranked = rankProviders(intent, preferences)

    // Calculate estimated burn (before making calls)
    const estimatedProviders = ranked.length
    const estimatedBurn = calculateBurn({ providers: estimatedProviders, retries: 0, fallbacks: 0 })

    // Burn credits if user_id provided
    if (user_id) {
      try {
        await burnCredits(user_id, estimatedBurn, 'invocation', {
          intent,
          providers: estimatedProviders,
          retries: 0,
          fallbacks: 0
        })
      } catch (creditError: any) {
        return NextResponse.json(
          { error: `Credit check failed: ${creditError.message}` },
          { status: 402 } // Payment Required
        )
      }
    }

    let lastError: any = null
    let providerUsed = ''
    let responseData: any = null
    let actualCost = 0
    let retryCount = 0
    let fallbackCount = 0

    // Try providers in order with fallback
    for (let i = 0; i < ranked.length; i++) {
      const provider = ranked[i]
      try {
        // Real provider call
        const providerData = await callProvider(provider.name, intent, payload)
        responseData = providerData
        providerUsed = provider.name
        actualCost = provider.cost

        // Calculate final charge
        const markup = PRICING_RULES[intent] || 0.02
        const totalCharge = Math.max(provider.cost + markup, 0.03)

        // Calculate actual burn including retries/fallbacks
        const actualBurn = calculateBurn({
          providers: i + 1,
          retries: retryCount,
          fallbacks: fallbackCount
        })

        // Log billing event (CRITICAL - never fail silently)
        try {
          const { error: billingError } = await supabase
            .from('api_billing_ledger')
            .insert({
              api_id: `exchange_${intent}`,
              user_id: user_id || 'anonymous',
              amount: totalCharge,
              currency: 'GBP',
              description: `API Exchange: ${intent} via ${provider.name}`,
              status: 'completed',
              metadata: {
                intent,
                provider: provider.name,
                latency_ms: Date.now() - startTime,
                upstream_cost: provider.cost,
                credits_burned: actualBurn
              }
            })

          if (billingError) {
            console.error('Billing log failed:', billingError)
            // Continue - don't fail the request if billing fails
          }
        } catch (billingError) {
          console.error('Billing exception:', billingError)
        }

        const latencyMs = Date.now() - startTime

        // Log successful exchange
        try {
          await supabase
            .from('api_exchange_logs')
            .insert({
              intent,
              provider: provider.name,
              user_id: user_id || 'anonymous',
              payload,
              response: providerData,
              cost: totalCharge,
              latency_ms: latencyMs,
              success: true
            })
        } catch (logError) {
          console.error('Exchange log failed:', logError)
        }

        return NextResponse.json({
          status: 'success',
          provider: provider.name,
          cost: totalCharge,
          latency_ms: latencyMs,
          data: providerData
        })

      } catch (error: any) {
        lastError = error
        console.error(`Provider ${provider.name} failed:`, error.message)

        // Track retries and fallbacks
        if (i > 0) {
          retryCount++
          if (i === ranked.length - 1) {
            fallbackCount++
          }
        }
        continue // Try next provider
      }
    }

    // All providers failed
    return NextResponse.json(
      { 
        status: 'error',
        message: 'All providers failed',
        last_error: lastError?.message || 'Unknown error'
      },
      { status: 502 }
    )

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
