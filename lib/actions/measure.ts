'use server'

import { logLatency } from './latency'

export async function measure(apiId: string, userId: string, requestId: string, fn: Function) {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()

  await logLatency(apiId, userId, requestId, end - start)

  return result
}
