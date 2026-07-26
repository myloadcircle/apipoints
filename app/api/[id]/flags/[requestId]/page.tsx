import { setFlag } from '@/server/set-flag'
import { listFlags } from '@/server/list-flags'
import { searchByFlag } from '@/server/search-by-flag'

export default async function FlagsPage({ params, searchParams }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const selectedFlag = searchParams.flag || null

  const flags = await listFlags(requestId, userId)
  const results = selectedFlag ? await searchByFlag(userId, apiId, selectedFlag) : []

  async function create(formData: FormData) {
    'use server'
    const flag = String(formData.get('flag'))
    const value = formData.get('value') === 'true'
    await setFlag(userId, apiId, requestId, flag, value)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Flags</h1>

      <form action={create} className='space-y-4'>
        <input
          name='flag'
          placeholder='Flag name (e.g. urgent, blocked, reviewed)'
          className='border p-2 rounded w-full'
        />
        <select name='value' className='border p-2 rounded w-full'>
          <option value='true'>True</option>
          <option value='false'>False</option>
        </select>
        <button className='px-4 py-2 bg-black text-white rounded'>
          Set Flag
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Flags for This Request</h2>

        {flags.map((f: any) => (
          <div key={f.id} className='border p-3 rounded bg-gray-50 flex items-center justify-between'>
            <p className='font-bold'>{f.flag}: {String(f.value)}</p>
            <a
              href={`?flag=${f.flag}`}
              className='text-blue-600 underline text-sm'
            >
              Search
            </a>
          </div>
        ))}
      </div>

      {selectedFlag && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold'>Requests With Flag "{selectedFlag}"</h2>

          {results.map((r: any) => (
            <div key={r.id} className='border p-4 rounded bg-gray-50 space-y-2'>
              <p className='font-bold'>Request {r.request_id}</p>
              <p className='text-sm text-gray-700'>Status: {r.request?.status}</p>

              <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(r.request?.payload, null, 2)}
              </pre>

              <p className='text-xs text-gray-500'>{r.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}