import { getUsageSnapshots } from '@/lib/actions/usage-snapshots'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: apis } = await supabase
    .from('apis')
    .select('*')
    .eq('owner_id', ownerId)

  const all = []

  for (const api of apis || []) {
    const snapshots = await getUsageSnapshots(api.id)
    all.push({ api, snapshots })
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {all.map(({ api, snapshots }: any) => (
        <div key={api.id} className="border p-6 rounded bg-gray-50 space-y-4">
          <h2 className="text-xl font-bold">{api.name}</h2>

          {snapshots.length === 0 && (
            <p className="text-gray-600">No usage snapshots yet.</p>
          )}

          <div className="space-y-2">
            {snapshots.map((s: any) => (
              <div key={s.id} className="border p-3 rounded bg-white">
                <p className="font-semibold">{s.date}</p>
                <p className="text-gray-700">{s.requests} requests</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
