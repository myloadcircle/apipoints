import { transferRequestOwnership } from '@/lib/actions/transfer-ownership'
import { listOwnershipHistory } from '@/lib/actions/transfer-ownership'

export const dynamic = 'force-dynamic'

export default async function OwnershipPage({ params }: { params: { id: string; requestId: string } }) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const history = await listOwnershipHistory(requestId)

  async function action(formData: FormData) {
    'use server'
    const newOwner = String(formData.get('newOwner'))
    await transferRequestOwnership(requestId, userId, newOwner)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Ownership</h1>

      <form action={action} className="space-y-4">
        <input
          name="newOwner"
          placeholder="New Owner User ID"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Transfer Ownership
        </button>
      </form>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Ownership History</h2>
        {history.length === 0 && (
          <p className="text-gray-600">No ownership transfers yet.</p>
        )}
        {history.map((h: any) => (
          <div key={h.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">From: {h.from_user} → To: {h.to_user}</p>
            <p className="text-xs text-gray-500">{h.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
