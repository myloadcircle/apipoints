import { listAuditEvents } from '@/lib/actions/audit'

export const dynamic = 'force-dynamic'

export default async function AuditPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const events = await listAuditEvents(apiId)

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Audit Trail</h1>

      {events.length === 0 && (
        <p className="text-gray-600">No audit events recorded.</p>
      )}

      <div className="space-y-4">
        {events.map((e: any) => (
          <div key={e.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">{e.action}</p>
            <p className="text-sm text-gray-700">
              By: {e.users?.email || 'Unknown'}
            </p>

            <pre className="text-xs bg-white p-3 rounded border mt-2 whitespace-pre-wrap">
              {JSON.stringify(e.details, null, 2)}
            </pre>

            <p className="text-xs text-gray-500 mt-2">{e.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
