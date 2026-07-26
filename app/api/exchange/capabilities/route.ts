import { NextResponse } from 'next/server'

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

export async function GET() {
  const capabilities = Object.keys(PROVIDERS).map(intent => ({
    intent,
    providers: PROVIDERS[intent].map(p => p.name),
    request_schema: {
      type: "object",
      properties: {
        payload: { type: "object", description: `Parameters for ${intent}` }
      }
    },
    response_schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        provider: { type: "string" },
        cost: { type: "number" },
        latency_ms: { type: "number" },
        data: { type: "object" }
      }
    }
  }))

  return NextResponse.json({
    capabilities,
    version: "1.0.0",
    endpoint: "/api/exchange"
  })
}
