import { listChangelog } from '@/lib/actions/changelog-v2'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function CreatorChangelogDashboard() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: apis } = await supabase
    .from('apis')
    .select('*')
    .eq('owner_id', ownerId)

  const all = []

  for (const api of apis || []) {
    const logs = await listChangelog(api.id)
    all.push({ api, logs })
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Your API Changelogs</h1>

      {all.map(({ api, logs }: any) => (
        <div key={api.id} className="border p-6 rounded bg-gray-50 space-y-4">
          <h2 className="text-xl font-bold">{api.name}</h2>

          {logs.length === 0 && (
            <p className="text-gray-600">No changelog entries yet.</p>
          )}

          {logs.map((l: any) => (
            <div key={l.id} className="border p-4 rounded bg-white">
              <h3 className="font-semibold">
                {l.version} — {l.title}
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{l.body}</p>
              <p className="text-xs text-gray-500 mt-2">{l.created_at}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
