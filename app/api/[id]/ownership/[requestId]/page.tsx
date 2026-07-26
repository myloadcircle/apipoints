import { transferOwnership } from '@/server/transfer-ownership'
import { listTransfers } from '@/server/list-transfers'

export default async function OwnershipPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const currentUserId = 'REPLACE_WITH_AUTH_USER_ID'

  const transfers = await listTransfers(requestId)

  async function action(formData: FormData) {
    'use server'
    const newOwnerId = String(formData.get('newOwnerId'))
    await transferOwnership(currentUserId, apiId, requestId, newOwnerId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Transfer Ownership</h1>

      <form action={action} className='space-y-4'>
        <input
          name='newOwnerId'
          placeholder='New Owner User ID'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Transfer Ownership
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Ownership Transfer History</h2>

        {transfers.map((t: any) => (
          <div key={t.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>From: {t.from_user_id}</p>
            <p className='font-bold'>To: {t.to_user_id}</p>

            <p className='text-xs text-gray-500'>{t.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}