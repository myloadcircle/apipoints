import { setPriority } from '@/server/set-priority'
import { getPriority } from '@/server/get-priority'
import { searchByPriority } from '@/server/search-by-priority'

export default async function PriorityPage({ params, searchParams }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const selectedPriority = searchParams.priority || null

  const current = await getPriority(requestId, userId)
  const results = selectedPriority ? await searchByPriority(userId, apiId, selectedPriority) : []

  async function action(formData: FormData) {
    'use server'
    const priority = String(formData.get('priority'))
    await setPriority(userId, apiId, requestId, priority)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Priority</h1>

      <form action={action} className='space-y-4'>
        <select name='priority' className='border p-2 rounded w-full'>
          <option value='low'>Low</option>
          <option value='normal'>Normal</option>
          <option value='high'>High</option>
          <option value='critical'>Critical</option>
        </select>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Set Priority
        </button>
      </form>

      {current && (
        <div className='border p-4 rounded bg-gray-50 space-y-2'>
          <p className='font-bold'>Current Priority</p>
          <p className='text-sm text-gray-700'>{current.priority}</p>
          <p className='text-xs text-gray-500'>{current.created_at}</p>
        </div>
      )}

      {selectedPriority && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold'>Requests With Priority "{selectedPriority}"</h2>

          {results.map((r: any) => (
            <div key={r.id} className='border p-4 rounded bg-gray-50 space-y-2'>
              <p className='font-bold'>Request {r.request_id}</p>
              <p className='text-sm text-gray-700'>Status: {r.request?.status}</p>

              <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(r.request?.payload, null, 2)}
              </pre>

              <p className='text-xs text-gray-500'>{r.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}