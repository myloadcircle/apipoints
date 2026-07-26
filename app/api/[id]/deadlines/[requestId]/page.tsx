import { setDeadline } from '@/server/set-deadline'
import { getDeadline } from '@/server/get-deadline'
import { searchOverdue } from '@/server/search-overdue'

export default async function DeadlinesPage({ params, searchParams }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const showOverdue = searchParams.overdue === 'true'

  const current = await getDeadline(requestId, userId)
  const overdue = showOverdue ? await searchOverdue(userId, apiId) : []

  async function action(formData: FormData) {
    'use server'
    const deadline = String(formData.get('deadline'))
    await setDeadline(userId, apiId, requestId, deadline)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Deadlines</h1>

      <form action={action} className='space-y-4'>
        <input
          type='datetime-local'
          name='deadline'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Set Deadline
        </button>
      </form>

      {current && (
        <div className='border p-4 rounded bg-gray-50 space-y-2'>
          <p className='font-bold'>Current Deadline</p>
          <p className='text-sm text-gray-700'>{current.deadline}</p>
          <p className='text-xs text-gray-500'>{current.created_at}</p>
        </div>
      )}

      <a
        href='?overdue=true'
        className='text-blue-600 underline text-sm'
      >
        View Overdue Requests
      </a>

      {showOverdue && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold'>Overdue Requests</h2>

          {overdue.map((o: any) => (
            <div key={o.id} className='border p-4 rounded bg-gray-50 space-y-2'>
              <p className='font-bold'>Request {o.request_id}</p>
              <p className='text-sm text-gray-700'>Deadline: {o.deadline}</p>
              <p className='text-sm text-red-600'>OVERDUE</p>

              <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(o.request?.payload, null, 2)}
              </pre>

              <p className='text-xs text-gray-500'>{o.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}