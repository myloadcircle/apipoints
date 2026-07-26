import { listWebhooks } from '@/lib/actions/webhooks'
import { addWebhook } from '@/lib/actions/webhooks'

export const dynamic = 'force-dynamic'

export default async function WebhooksPage() {
  const ownerId = 'REPLACE_WITH_AUTH_USER_ID'
  const hooks = await listWebhooks(ownerId)

  async function action(formData: FormData) {
    'use server'
    const url = String(formData.get('url'))
    await addWebhook(ownerId, url)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Webhooks</h1>

      <form action={action} className="space-y-4">
        <input
          name="url"
          placeholder="Webhook URL"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Webhook
        </button>
      </form>

      <div className="space-y-4">
        {hooks.length === 0 && (
          <p className="text-gray-600">No webhooks yet.</p>
        )}
        {hooks.map((h: any) => (
          <div key={h.id} className="border p-4 rounded bg-gray-50">
            <p className="font-mono text-sm break-all">{h.url}</p>
            <p className="text-xs text-gray-500 mt-2">{h.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
