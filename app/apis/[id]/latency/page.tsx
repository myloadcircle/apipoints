import { listLatency } from '@/lib/actions/latency'

export const dynamic = 'force-dynamic'

export default async function LatencyPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const rows = await listLatency(apiId)

  const avg =
    rows.length > 0
      ? rows.reduce((s: number, r: any) => s + Number(r.ms), 0) / rows.length
      : 0

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Latency</h1>

      <div className="border p-4 rounded bg-gray-50">
        <h2 className="text-xl font-bold">Average Latency</h2>
        <p className="text-2xl font-semibold">{avg.toFixed(2)} ms</p>
      </div>

      <div className="space-y-4">
        {rows.map((r: any) => (
          <div key={r.id} className="border p-4 rounded bg-white">
            <p className="font-bold">{Number(r.ms).toFixed(2)} ms</p>
            <p className="text-sm text-gray-700">
              User: {r.users?.email || 'Unknown'}
            </p>
            <p className="text-sm text-gray-700">
              Request ID: {r.request_id}
            </p>
            <p className="text-xs text-gray-500 mt-2">{r.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
