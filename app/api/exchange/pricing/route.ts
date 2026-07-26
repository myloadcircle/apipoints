import { NextResponse } from 'next/server'

const PRICING: Record<string, {
  base_cost: number
  markup: number
  total: number
  currency: string
}> = {
  company_check: { base_cost: 0.00, markup: 0.03, total: 0.03, currency: "GBP" },
  vehicle_check: { base_cost: 0.03, markup: 0.02, total: 0.05, currency: "GBP" },
  identity_check: { base_cost: 0.00, markup: 0.05, total: 0.05, currency: "GBP" },
  valuation: { base_cost: 0.05, markup: 0.05, total: 0.10, currency: "GBP" },
  tender_lookup: { base_cost: 0.02, markup: 0.03, total: 0.05, currency: "GBP" },
  risk_score: { base_cost: 0.03, markup: 0.02, total: 0.05, currency: "GBP" }
}

const PRICING_MODEL = {
  model: "per_call",
  rules: [
    "charge = upstream_cost + markup",
    "markup = 0.02 to 0.10 depending on category",
    "minimum_charge = 0.03",
    "maximum_charge = 0.99"
  ]
}

export async function GET() {
  return NextResponse.json({
    model: PRICING_MODEL,
    pricing: PRICING,
    examples: {
      company_check: "£0.03",
      vehicle_check: "£0.05",
      identity_check: "£0.05",
      valuation: "£0.10",
      tender_lookup: "£0.05",
      risk_score: "£0.05"
    }
  })
}
