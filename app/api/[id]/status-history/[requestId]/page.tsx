import { listStatusHistory } from '@/server/list-status-history'
import { updateRequestStatus } from '@/server/update-request-status'

export default async function StatusHistoryPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const history = await listStatusHistory(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const newStatus = String(formData.get('newStatus'))
    await updateRequestStatus(userId, apiId, requestId, newStatus)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Status History</h1>

      <form action={action} className='space-y-4'>
        <select name='newStatus' className='border p-2 rounded w-full'>
          <option value='pending'>Pending</option>
          <option value='processing'>Processing</option>
          <option value='completed'>Completed</option>
          <option value='failed'>Failed</option>
          <option value='archived'>Archived</option>
        </select>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Update Status
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>History</h2>

        {history.map((h: any) => (
          <div key={h.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>{h.old_status} → {h.new_status}</p>
            <p className='text-xs text-gray-500'>{h.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}