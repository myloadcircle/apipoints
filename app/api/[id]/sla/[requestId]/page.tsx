import { setSLA } from '@/server/set-sla'
import { getSLA } from '@/server/get-sla'
import { evaluateSLA } from '@/server/evaluate-sla'

export default async function SLAPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const current = await getSLA(requestId, userId)
  const evaluation = await evaluateSLA(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const targetMs = Number(formData.get('targetMs'))
    await setSLA(userId, apiId, requestId, targetMs)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>SLA Tracking</h1>

      <form action={action} className='space-y-4'>
        <input
          name='targetMs'
          placeholder='Target latency (ms)'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Set SLA Target
        </button>
      </form>

      {current && (
        <div className='border p-4 rounded bg-gray-50 space-y-2'>
          <p className='font-bold'>Current SLA Target</p>
          <p className='text-sm text-gray-700'>{current.target_ms} ms</p>
          <p className='text-xs text-gray-500'>{current.created_at}</p>
        </div>
      )}

      {evaluation && (
        <div className='border p-4 rounded bg-gray-50 space-y-2'>
          <p className='font-bold'>SLA Evaluation</p>
          <p className='text-sm text-gray-700'>Target: {evaluation.target} ms</p>
          <p className='text-sm text-gray-700'>Actual: {evaluation.actual} ms</p>
          <p className='text-sm font-semibold'>
            {evaluation.met ? 'SLA Met' : 'SLA Breached'}
          </p>
        </div>
      )}
    </div>
  )
}