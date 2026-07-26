'use server'

import { getUserPlan } from './get-user-plan'
import { countRequestsThisMonth } from './count-requests-this-month'

export async function enforceRateLimit(userId: string, apiId: string) {
  const plan = await getUserPlan(userId, apiId)
  if (!plan) return { allowed: false, reason: 'No active plan' }

  const limit = plan.api_plans?.[0]?.monthly_limit
  if (!limit) return { allowed: true } // unlimited

  const used = await countRequestsThisMonth(userId, apiId)

  if (used >= limit) {
    return { allowed: false, reason: 'Monthly limit reached' }
  }

  return { allowed: true }
}