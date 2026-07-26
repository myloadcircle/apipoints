import { listAnnouncements } from '@/lib/actions/announcements'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function CreatorAnnouncementsDashboard() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: apis } = await supabase
    .from('apis')
    .select('*')
    .eq('owner_id', ownerId)

  const all = []

  for (const api of apis || []) {
    const anns = await listAnnouncements(api.id)
    all.push({ api, anns })
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Your API Announcements</h1>

      {all.map(({ api, anns }: any) => (
        <div key={api.id} className="border p-6 rounded bg-gray-50 space-y-4">
          <h2 className="text-xl font-bold">{api.name}</h2>

          {anns.length === 0 && (
            <p className="text-gray-600">No announcements yet.</p>
          )}

          {anns.map((a: any) => (
            <div key={a.id} className="border p-4 rounded bg-white">
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-gray-700 whitespace-pre-line">{a.body}</p>
              <p className="text-xs text-gray-500 mt-2">{a.created_at}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
