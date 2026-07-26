import { addComment } from '@/server/add-comment'
import { listComments } from '@/server/list-comments'

export default async function CommentsPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const comments = await listComments(requestId, userId)

  async function create(formData: FormData) {
    'use server'
    const message = String(formData.get('message'))
    await addComment(userId, apiId, requestId, message)
  }

  async function reply(formData: FormData) {
    'use server'
    const message = String(formData.get('message'))
    const parentId = String(formData.get('parentId'))
    await addComment(userId, apiId, requestId, message, parentId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Comments</h1>

      <form action={create} className='space-y-4'>
        <textarea
          name='message'
          placeholder='Write a comment...'
          className='border p-2 rounded w-full h-24'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Add Comment
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Comment Thread</h2>

        {comments.map((c: any) => (
          <div key={c.id} className='border p-4 rounded bg-gray-50 space-y-3'>
            <p className='font-bold'>User {c.user_id}</p>
            <p>{c.message}</p>
            <p className='text-xs text-gray-500'>{c.created_at}</p>

            <form action={reply} className='space-y-2'>
              <input type='hidden' name='parentId' value={c.id} />
              <textarea
                name='message'
                placeholder='Reply...'
                className='border p-2 rounded w-full h-16'
              />
              <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                Reply
              </button>
            </form>

            {c.replies?.length > 0 && (
              <div className='ml-6 space-y-3'>
                {c.replies.map((r: any) => (
                  <div key={r.id} className='border p-3 rounded bg-white'>
                    <p className='font-bold'>User {r.user_id}</p>
                    <p>{r.message}</p>
                    <p className='text-xs text-gray-500'>{r.created_at}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}