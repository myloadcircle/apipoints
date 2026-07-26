'use server'

import { logAPIError } from './api-errors-v2'

export async function safeExecute(apiId: string, userId: string, requestId: string, fn: Function) {
  try {
    return await fn()
  } catch (err) {
    await logAPIError(apiId, userId, requestId, err)
    throw err
  }
}
