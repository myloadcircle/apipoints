import { createAPIKey, listAPIKeys } from '@/lib/actions/api-keys'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function KeysPage() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'
  const keys = await listAPIKeys(ownerId)

  async function action() {
    'use server'
    await createAPIKey(ownerId)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">API Keys</h1>

      <form action={action}>
        <button className="px-4 py-2 bg-black text-white rounded">
          Generate New Key
        </button>
      </form>

      <div className="space-y-4">
        {keys.length === 0 && (
          <p className="text-gray-600">No API keys yet.</p>
        )}
        {keys.map((k: any) => (
          <div key={k.id} className="border p-4 rounded bg-gray-50">
            <p className="font-mono text-sm break-all">{k.key}</p>
            <p className="text-xs text-gray-500 mt-2">{k.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
