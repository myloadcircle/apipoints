import { createLink } from '@/server/create-link'
import { listLinks } from '@/server/list-links'

export default async function LinksPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const links = await listLinks(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const toId = String(formData.get('toId'))
    const label = String(formData.get('label'))
    await createLink(userId, apiId, requestId, toId, label)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Request Links</h1>

      <form action={action} className='space-y-4'>
        <input
          name='toId'
          placeholder='Target Request ID'
          className='border p-2 rounded w-full'
        />
        <input
          name='label'
          placeholder='Label (e.g. parent, child, related, follow-up)'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Create Link
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Linked Requests</h2>

        {links.map((l: any) => (
          <div key={l.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>{l.label}</p>
            <p className='text-sm text-gray-700'>→ Request {l.to_request}</p>
            <p className='text-sm text-gray-700'>Status: {l.target?.status}</p>

            <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(l.target?.payload, null, 2)}
            </pre>

            <p className='text-xs text-gray-500'>{l.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}