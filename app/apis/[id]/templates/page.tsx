import { createTemplate } from '@/lib/actions/templates'
import { listTemplates } from '@/lib/actions/templates'
import { applyTemplate } from '@/lib/actions/templates'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const templates = await listTemplates(userId, apiId)

  async function create(formData: FormData) {
    'use server'
    const name = String(formData.get('name'))
    const payload = JSON.parse(String(formData.get('payload')))
    await createTemplate(userId, apiId, name, payload)
  }

  async function apply(formData: FormData) {
    'use server'
    const templateId = String(formData.get('templateId'))
    await applyTemplate(userId, apiId, templateId)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Templates</h1>

      <form action={create} className="space-y-4">
        <input
          name="name"
          placeholder="Template name (e.g. Create User, Send Invoice)"
          className="border p-2 rounded w-full"
        />
        <textarea
          name="payload"
          placeholder="JSON payload"
          className="border p-2 rounded w-full h-32"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Create Template
        </button>
      </form>

      <div className="space-y-6">
        {templates.map((t: any) => (
          <div key={t.id} className="border p-4 rounded bg-gray-50 space-y-3">
            <p className="font-bold">{t.name}</p>
            <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
              {JSON.stringify(t.payload, null, 2)}
            </pre>

            <form action={apply}>
              <input type="hidden" name="templateId" value={t.id} />
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Apply Template
              </button>
            </form>

            <p className="text-xs text-gray-500">{t.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
