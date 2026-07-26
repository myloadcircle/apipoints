import { createAccessToken } from '@/lib/actions/access-tokens'
import { listTokens } from '@/lib/actions/access-tokens'
import { revokeToken } from '@/lib/actions/access-tokens'

export const dynamic = 'force-dynamic'

export default async function TokensPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const tokens = await listTokens(userId, apiId)

  let newToken: string | null = null

  async function create(formData: FormData) {
    'use server'
    const label = String(formData.get('label'))
    const scopes = (formData.getAll('scopes') as string[]) || []
    newToken = await createAccessToken(userId, apiId, label, scopes)
  }

  async function revoke(formData: FormData) {
    'use server'
    const id = String(formData.get('id'))
    await revokeToken(id, userId)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Access Tokens</h1>

      <form action={create} className="space-y-4">
        <input
          name="label"
          placeholder="Token label (e.g. Production Server)"
          className="border p-2 rounded w-full"
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scopes" value="read" /> Read
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scopes" value="write" /> Write
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scopes" value="admin" /> Admin
          </label>
        </div>

        <button className="px-4 py-2 bg-black text-white rounded">
          Create Token
        </button>

        {newToken && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-bold text-sm">New Token (copy now, shown once):</p>
            <p className="font-mono text-xs break-all mt-1">{newToken}</p>
          </div>
        )}
      </form>

      <div className="space-y-4">
        {tokens.map((t: any) => (
          <form
            key={t.id}
            action={revoke}
            className="border p-4 rounded bg-gray-50 space-y-2"
          >
            <input type="hidden" name="id" value={t.id} />

            <p className="font-bold">{t.label}</p>
            <p className="text-sm text-gray-700">Scopes: {t.scopes?.join(', ')}</p>
            <p className="text-xs text-gray-500">{t.created_at}</p>

            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
              Revoke
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
