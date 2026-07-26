import { addChangelog } from '@/lib/actions/changelog-v2'
import { listChangelog } from '@/lib/actions/changelog-v2'

export const dynamic = 'force-dynamic'

export default async function ChangelogPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const logs = await listChangelog(apiId)

  async function action(formData: FormData) {
    'use server'
    const version = String(formData.get('version'))
    const title = String(formData.get('title'))
    const body = String(formData.get('body'))
    await addChangelog(apiId, version, title, body)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Changelog</h1>

      <form action={action} className="space-y-4">
        <input
          name="version"
          placeholder="Version (e.g. v1.2.0)"
          className="border p-2 rounded w-full"
        />
        <input
          name="title"
          placeholder="Change title"
          className="border p-2 rounded w-full"
        />
        <textarea
          name="body"
          placeholder="Describe the changes..."
          className="border p-2 rounded w-full h-32"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Publish Entry
        </button>
      </form>

      <div className="space-y-4">
        {logs.length === 0 && (
          <p className="text-gray-600">No changelog entries yet.</p>
        )}
        {logs.map((l: any) => (
          <div key={l.id} className="border p-4 rounded bg-gray-50">
            <h2 className="font-bold">
              {l.version} — {l.title}
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{l.body}</p>
            <p className="text-xs text-gray-500 mt-2">{l.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
