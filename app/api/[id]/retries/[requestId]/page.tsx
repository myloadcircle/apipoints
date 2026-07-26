import { setRetryPolicy } from '@/server/set-retry-policy'
import { getRetryPolicy } from '@/server/get-retry-policy'

export default async function RetryPolicyPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const policy = await getRetryPolicy(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const maxRetries = Number(formData.get('maxRetries'))
    const backoffMs = Number(formData.get('backoffMs'))
    await setRetryPolicy(userId, apiId, requestId, maxRetries, backoffMs)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Retry Policy</h1>

      <form action={action} className='space-y-4'>
        <input
          name='maxRetries'
          placeholder='Max retries'
          className='border p-2 rounded w-full'
        />
        <input
          name='backoffMs'
          placeholder='Backoff (ms)'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Set Retry Policy
        </button>
      </form>

      {policy && (
        <div className='border p-4 rounded bg-gray-50 space-y-2'>
          <p className='font-bold'>Current Retry Policy</p>
          <p className='text-sm text-gray-700'>Max retries: {policy.max_retries}</p>
          <p className='text-sm text-gray-700'>Backoff: {policy.backoff_ms} ms</p>
          <p className='text-xs text-gray-500'>{policy.created_at}</p>
        </div>
      )}
    </div>
  )
}