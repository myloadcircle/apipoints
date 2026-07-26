import { shareRequest } from '@/server/share-request'
import { listShares } from '@/server/list-shares'

export default async function SharingPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const shares = await listShares(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const targetUserId = String(formData.get('targetUserId'))
    const permission = String(formData.get('permission')) as 'view' | 'edit'
    await shareRequest(userId, apiId, requestId, targetUserId, permission)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Share Request</h1>

      <form action={action} className='space-y-4'>
        <input
          name='targetUserId'
          placeholder='User ID to share with'
          className='border p-2 rounded w-full'
        />
        <select name='permission' className='border p-2 rounded w-full'>
          <option value='view'>View</option>
          <option value='edit'>Edit</option>
        </select>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Share Request
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Shared With</h2>

        {shares.map((s: any) => (
          <div key={s.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>User: {s.target_user_id}</p>
            <p className='text-sm text-gray-700'>Permission: {s.permission}</p>
            <p className='text-xs text-gray-500'>{s.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}