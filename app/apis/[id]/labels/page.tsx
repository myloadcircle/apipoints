import { createLabel } from '@/lib/actions/labels'
import { listLabels } from '@/lib/actions/labels'
import { assignLabel } from '@/lib/actions/labels'
import { listLabelsForRequest } from '@/lib/actions/labels'

export const dynamic = 'force-dynamic'

export default async function LabelsPage({ params, searchParams }: { params: { id: string }, searchParams: { request?: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const requestId = searchParams.request || null

  const labels = await listLabels(userId, apiId)
  const assigned = requestId ? await listLabelsForRequest(requestId, userId) : []

  async function create(formData: FormData) {
    'use server'
    const name = String(formData.get('name'))
    const color = String(formData.get('color'))
    await createLabel(userId, apiId, name, color)
  }

  async function assign(formData: FormData) {
    'use server'
    const labelId = String(formData.get('labelId'))
    const reqId = String(formData.get('requestId'))
    await assignLabel(userId, apiId, reqId, labelId)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Request Labels</h1>

      <form action={create} className="space-y-4">
        <input
          name="name"
          placeholder="Label name (e.g. Critical, Review, Blocked)"
          className="border p-2 rounded w-full"
        />
        <input
          name="color"
          placeholder="Color (e.g. #FF0000)"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Create Label
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Labels</h2>
        {labels.map((l: any) => (
          <div key={l.id} className="border p-4 rounded bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: l.color }}
              />
              <p className="font-bold">{l.name}</p>
            </div>
            <a
              href={`?request=${requestId || ''}&label=${l.id}`}
              className="text-blue-600 underline text-sm"
            >
              Assign
            </a>
          </div>
        ))}
      </div>

      {requestId && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Labels for Request {requestId}</h2>

          <form action={assign} className="space-y-4">
            <input type="hidden" name="requestId" value={requestId} />
            <select name="labelId" className="border p-2 rounded w-full">
              {labels.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              Assign Label
            </button>
          </form>

          <div className="space-y-4">
            {assigned.map((a: any) => (
              <div key={a.id} className="border p-4 rounded bg-white">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: a.label?.color }}
                  />
                  <p className="font-bold">{a.label?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
