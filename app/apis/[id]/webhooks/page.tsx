import { addWebhook } from '@/lib/actions/webhooks-user'
import { listWebhooks } from '@/lib/actions/webhooks-user'

export const dynamic = 'force-dynamic'

export default async function WebhooksPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const webhooks = await listWebhooks(apiId, userId)

  async function action(formData: FormData) {
    'use server'
    const url = String(formData.get('url'))
    const event = String(formData.get('event'))
    await addWebhook(apiId, userId, url, event)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Webhooks</h1>

      <form action={action} className="space-y-4">
        <input
          name="url"
          placeholder="Webhook URL"
          className="border p-2 rounded w-full"
        />
        <select name="event" className="border p-2 rounded w-full">
          <option value="request.completed">request.completed</option>
          <option value="request.failed">request.failed</option>
          <option value="refund.approved">refund.approved</option>
          <option value="refund.rejected">refund.rejected</option>
        </select>
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Webhook
        </button>
      </form>

      <div className="space-y-4">
        {webhooks.length === 0 && (
          <p className="text-gray-600">No webhooks yet.</p>
        )}
        {webhooks.map((w: any) => (
          <div key={w.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">{w.event}</p>
            <p className="text-sm text-gray-700">{w.url}</p>
            <p className="text-xs text-gray-500 mt-2">{w.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
