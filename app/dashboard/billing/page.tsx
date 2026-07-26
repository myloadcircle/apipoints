import { listBillingEvents } from '@/lib/actions/billing-events'

export const dynamic = 'force-dynamic'

export default async function BillingDashboard() {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const events = await listBillingEvents(userId)

  const total = events.reduce((sum: number, e: any) => sum + Number(e.cost), 0)

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>

      <div className="border p-4 rounded bg-gray-50">
        <h2 className="text-xl font-bold">Total This Month</h2>
        <p className="text-2xl font-semibold">${total.toFixed(2)}</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 && (
          <p className="text-gray-600">No billing events yet.</p>
        )}
        {events.map((e: any) => (
          <div key={e.id} className="border p-4 rounded bg-white">
            <h3 className="font-bold">{e.apis?.name}</h3>
            <p className="text-sm text-gray-700">
              Request at {e.requests?.created_at}
            </p>
            <p className="text-sm text-gray-700">Cost: ${Number(e.cost).toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-2">{e.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
