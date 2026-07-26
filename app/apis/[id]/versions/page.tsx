import { listVersions } from '@/lib/actions/versions'
import { addVersion } from '@/lib/actions/versions'

export const dynamic = 'force-dynamic'

export default async function VersionsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const versions = await listVersions(apiId)

  async function action(formData: FormData) {
    'use server'
    const version = String(formData.get('version'))
    const endpoint = String(formData.get('endpoint'))
    await addVersion(apiId, version, endpoint)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">API Versions</h1>

      <form action={action} className="space-y-4">
        <input
          name="version"
          placeholder="Version (e.g. v1.1, v2)"
          className="border p-2 rounded w-full"
        />
        <input
          name="endpoint"
          placeholder="Endpoint URL"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Version
        </button>
      </form>

      <div className="space-y-4">
        {versions.length === 0 && (
          <p className="text-gray-600">No versions yet.</p>
        )}
        {versions.map((v: any) => (
          <div key={v.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">{v.version}</p>
            <p className="text-sm text-gray-600">{v.endpoint}</p>
            <p className="text-xs text-gray-500 mt-2">{v.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
