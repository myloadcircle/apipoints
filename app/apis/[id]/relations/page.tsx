import { linkRequests } from '@/lib/actions/request-relations'
import { listRelations } from '@/lib/actions/request-relations'

export const dynamic = 'force-dynamic'

export default async function RelationsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const relations = await listRelations(apiId, userId)

  async function action(formData: FormData) {
    'use server'
    const parentId = String(formData.get('parentId'))
    const childId = String(formData.get('childId'))
    await linkRequests(userId, apiId, parentId, childId)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Relations</h1>

      <form action={action} className="space-y-4">
        <input
          name="parentId"
          placeholder="Parent Request ID"
          className="border p-2 rounded w-full"
        />
        <input
          name="childId"
          placeholder="Child Request ID"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Link Requests
        </button>
      </form>

      <div className="space-y-6">
        {relations.map((r: any) => (
          <div key={r.id} className="border p-4 rounded bg-gray-50 space-y-2">
            <p className="font-bold">Parent → Child</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Parent</p>
                <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
                  {JSON.stringify(r.parent?.payload, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold">Child</p>
                <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
                  {JSON.stringify(r.child?.payload, null, 2)}
                </pre>
              </div>
            </div>

            <p className="text-xs text-gray-500">{r.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
