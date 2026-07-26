import { listLogs } from '@/lib/actions/access-logs'

export const dynamic = 'force-dynamic'

export default async function LogsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const logs = await listLogs(apiId)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Access Logs</h1>

      <div className="space-y-4">
        {logs.length === 0 && (
          <p className="text-gray-600">No logs yet.</p>
        )}
        {logs.map((log: any) => (
          <div key={log.id} className="border p-4 rounded bg-gray-50">
            <p className="text-xs text-gray-500">{log.created_at}</p>

            <div className="mt-2">
              <h3 className="font-semibold">Input</h3>
              <pre className="text-sm bg-white p-3 rounded border">
                {JSON.stringify(log.input, null, 2)}
              </pre>
            </div>

            <div className="mt-2">
              <h3 className="font-semibold">Output</h3>
              <pre className="text-sm bg-white p-3 rounded border">
                {JSON.stringify(log.output, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
