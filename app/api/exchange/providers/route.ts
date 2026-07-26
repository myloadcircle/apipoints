import { NextRequest, NextResponse } from 'next/server'

const PROVIDERS: Record<string, Array<{
  name: string
  cost: number
  speed: string
  reliability: string
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const intent = searchParams.get('intent')

  if (intent) {
    const providers = PROVIDERS[intent]
    if (!providers) {
      return NextResponse.json(
        { error: `No providers for intent: ${intent}` },
        { status: 404 }
      )
    }
    return NextResponse.json({
      intent,
      providers,
      count: providers.length
    })
  }

  return NextResponse.json({
    providers: PROVIDERS,
    intents: Object.keys(PROVIDERS),
    total_providers: Object.values(PROVIDERS).flat().length
  })
}
