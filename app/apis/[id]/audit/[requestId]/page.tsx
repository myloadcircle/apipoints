import { listAuditEvents } from '@/lib/actions/audit-log'

export const dynamic = 'force-dynamic'

export default async function AuditPage({ params }: { params: { id: string; requestId: string } }) {
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const events = await listAuditEvents(requestId, userId)

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <div className="space-y-4">
        {events.length === 0 && (
          <p className="text-gray-600">No audit events recorded.</p>
        )}
        {events.map((e: any) => (
          <div key={e.id} className="border p-4 rounded bg-gray-50 space-y-2">
            <p className="font-bold">{e.action}</p>
            <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
              {JSON.stringify(e.metadata, null, 2)}
            </pre>
            <p className="text-xs text-gray-500">{e.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
