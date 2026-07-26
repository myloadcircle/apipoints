import { listVersions } from '@/server/list-versions'
import { restoreVersion } from '@/server/restore-version'
import { saveVersion } from '@/server/save-version'

export default async function VersionsPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const versions = await listVersions(requestId, userId)

  async function save(formData: FormData) {
    'use server'
    const payload = JSON.parse(String(formData.get('payload')))
    await saveVersion(userId, apiId, requestId, payload)
  }

  async function restore(formData: FormData) {
    'use server'
    const versionId = String(formData.get('versionId'))
    await restoreVersion(userId, apiId, requestId, versionId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Request Versions</h1>

      <form action={save} className='space-y-4'>
        <textarea
          name='payload'
          placeholder='JSON payload to save as new version'
          className='border p-2 rounded w-full h-32'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Save Version
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Version History</h2>

        {versions.map((v: any) => (
          <div key={v.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>Version {v.id}</p>

            <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(v.payload, null, 2)}
            </pre>

            <form action={restore}>
              <input type='hidden' name='versionId' value={v.id} />
              <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                Restore This Version
              </button>
            </form>

            <p className='text-xs text-gray-500'>{v.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}