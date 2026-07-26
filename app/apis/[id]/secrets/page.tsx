import { addSecret } from '@/lib/actions/secrets'
import { listSecrets } from '@/lib/actions/secrets'
import { getSecretValue } from '@/lib/actions/secrets'

export const dynamic = 'force-dynamic'

export default async function SecretsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const secrets = await listSecrets(userId, apiId)

  async function action(formData: FormData) {
    'use server'
    const name = String(formData.get('name'))
    const value = String(formData.get('value'))
    await addSecret(userId, apiId, name, value)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">API Secrets</h1>

      <form action={action} className="space-y-4">
        <input
          name="name"
          placeholder="Secret name (e.g. OPENAI_KEY)"
          className="border p-2 rounded w-full"
        />
        <input
          name="value"
          placeholder="Secret value"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Secret
        </button>
      </form>

      <div className="space-y-4">
        {secrets.length === 0 && (
          <p className="text-gray-600">No secrets yet.</p>
        )}
        {secrets.map((s: any) => (
          <details key={s.id} className="border p-4 rounded bg-gray-50">
            <summary className="cursor-pointer font-bold">
              {s.name} — added {s.created_at}
            </summary>

            <SecretValue id={s.id} userId={userId} />
          </details>
        ))}
      </div>
    </div>
  )
}

async function SecretValue({ id, userId }: { id: string; userId: string }) {
  const value = await getSecretValue(id, userId)

  return (
    <pre className="mt-3 bg-white p-3 rounded border text-sm whitespace-pre-wrap">
      {value}
    </pre>
  )
}
