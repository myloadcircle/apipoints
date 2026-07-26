import { listDisputesForCreator } from '@/lib/actions/disputes'
import { resolveDispute } from '@/lib/actions/disputes'

export const dynamic = 'force-dynamic'

export default async function DisputesDashboard() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'
  const disputes = await listDisputesForCreator(ownerId)

  async function action(formData: FormData) {
    'use server'
    const id = String(formData.get('id'))
    const decision = String(formData.get('decision')) as 'approved' | 'rejected'
    await resolveDispute(id, decision)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Disputes</h1>

      {disputes.length === 0 && (
        <p className="text-gray-600">No disputes to review.</p>
      )}

      <div className="space-y-4">
        {disputes.map((d: any) => (
          <form
            key={d.id}
            action={action}
            className="border p-4 rounded bg-gray-50 space-y-3"
          >
            <input type="hidden" name="id" value={d.id} />

            <h2 className="font-bold">{d.apis?.name}</h2>
            <p className="text-sm text-gray-700">
              User: {d.users?.email || 'Unknown'}
            </p>
            <p className="text-sm text-gray-700">Reason: {d.reason}</p>
            <p className="text-xs text-gray-500">{d.created_at}</p>

            <div className="flex gap-2">
              <button
                name="decision"
                value="approved"
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Approve
              </button>
              <button
                name="decision"
                value="rejected"
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Reject
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  )
}
