import { addDependency } from '@/lib/actions/request-dependencies'
import { listDependencies } from '@/lib/actions/request-dependencies'

export const dynamic = 'force-dynamic'

export default async function DependenciesPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const deps = await listDependencies(apiId, userId)

  async function action(formData: FormData) {
    'use server'
    const requestId = String(formData.get('requestId'))
    const dependsOn = String(formData.get('dependsOn'))
    await addDependency(userId, apiId, requestId, dependsOn)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Dependencies</h1>

      <form action={action} className="space-y-4">
        <input
          name="requestId"
          placeholder="Request ID (child)"
          className="border p-2 rounded w-full"
        />
        <input
          name="dependsOn"
          placeholder="Depends on Request ID (parent)"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Dependency
        </button>
      </form>

      <div className="space-y-6">
        {deps.map((d: any) => (
          <div key={d.id} className="border p-4 rounded bg-gray-50 space-y-2">
            <p className="font-bold">Dependency</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Parent (must complete first)</p>
                <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
                  {JSON.stringify(d.parent?.payload, null, 2)}
                </pre>
                <p className="text-xs text-gray-600">Status: {d.parent?.status}</p>
              </div>

              <div>
                <p className="text-sm font-semibold">Child (blocked until parent completes)</p>
                <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap">
                  {JSON.stringify(d.child?.payload, null, 2)}
                </pre>
                <p className="text-xs text-gray-600">Status: {d.child?.status}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500">{d.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
