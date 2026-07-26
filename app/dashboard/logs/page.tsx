import { getLogs } from '@/lib/actions/logs'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const logs = await getLogs()

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">API Usage Logs</h1>
      <div className="space-y-4">
        {logs.length === 0 && (
          <p className="text-gray-600">No logs yet.</p>
        )}
        {logs.map((log: any) => (
          <div key={log.id} className="border p-4 rounded bg-gray-50">
            <p className="text-xs text-gray-500">{log.created_at}</p>
            <pre className="text-sm mt-2">Input: {JSON.stringify(log.input, null, 2)}</pre>
            <pre className="text-sm mt-2">Output: {JSON.stringify(log.output, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
