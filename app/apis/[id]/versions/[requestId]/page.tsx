import { createVersion } from '@/lib/actions/request-versions'
import { listVersions } from '@/lib/actions/request-versions'
import { diffPayloads } from '@/lib/actions/request-versions'

export const dynamic = 'force-dynamic'

export default async function VersionsPage({ params, searchParams }: { params: { id: string; requestId: string }, searchParams: { left?: string; right?: string } }) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const versions = await listVersions(requestId, userId)

  const leftId = searchParams.left || null
  const rightId = searchParams.right || null

  const left = leftId ? versions.find((v: any) => v.id === leftId) : null
  const right = rightId ? versions.find((v: any) => v.id === rightId) : null

  const differences = left && right ? diffPayloads(left.payload, right.payload) : []

  async function action(formData: FormData) {
    'use server'
    await createVersion(userId, apiId, requestId)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Versions</h1>

      <form action={action}>
        <button className="px-4 py-2 bg-black text-white rounded">
          Create New Version
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Version History</h2>

        {versions.map((v: any) => (
          <div key={v.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">Version {v.id}</p>
            <p className="text-sm text-gray-700">Status: {v.status}</p>
            <div className="mt-2 flex gap-2">
              <a
                href={`?left=${v.id}`}
                className="text-blue-600 underline text-sm"
              >
                Compare as Left
              </a>
              {' • '}
              <a
                href={`?right=${v.id}`}
                className="text-blue-600 underline text-sm"
              >
                Compare as Right
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">{v.created_at}</p>
          </div>
        ))}
      </div>

      {left && right && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Comparing Version {left.id} ↔ {right.id}
          </h2>

          {differences.length === 0 && (
            <p className="text-gray-600">No differences found.</p>
          )}

          <div className="space-y-4">
            {differences.map((d: any) => (
              <div key={d.key} className="border p-4 rounded bg-white">
                <p className="font-bold">{d.key}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <pre className="text-xs bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                    {JSON.stringify(d.left, null, 2)}
                  </pre>
                  <pre className="text-xs bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                    {JSON.stringify(d.right, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
