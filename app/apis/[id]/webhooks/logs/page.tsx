import { listWebhookLogs } from '@/lib/actions/webhook-logs'

export const dynamic = 'force-dynamic'

export default async function WebhookLogsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const logs = await listWebhookLogs(apiId, userId)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Webhook Delivery Logs</h1>

      <div className="space-y-4">
        {logs.length === 0 && (
          <p className="text-gray-600">No webhook deliveries yet.</p>
        )}
        {logs.map((l: any) => (
          <div key={l.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">{l.api_webhooks?.event}</p>
            <p className="text-sm text-gray-700">URL: {l.api_webhooks?.url}</p>
            <p className="text-sm text-gray-700">Status: {l.status}</p>

            <pre className="text-xs bg-white p-3 rounded border mt-2 overflow-auto">
              {JSON.stringify(l.response, null, 2)}
            </pre>

            <p className="text-xs text-gray-500 mt-2">{l.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
