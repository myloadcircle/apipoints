import { addMention } from '@/server/add-mention'
import { listMentions } from '@/server/list-mentions'

export default async function MentionsPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const mentions = await listMentions(requestId)

  async function action(formData: FormData) {
    'use server'
    const mentionedUserId = String(formData.get('mentionedUserId'))
    const context = String(formData.get('context'))
    await addMention(userId, apiId, requestId, mentionedUserId, context)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Mentions</h1>

      <form action={action} className='space-y-4'>
        <input
          name='mentionedUserId'
          placeholder='User ID to mention'
          className='border p-2 rounded w-full'
        />
        <textarea
          name='context'
          placeholder='Context for the mention (e.g. "needs review", "please check this")'
          className='border p-2 rounded w-full h-24'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Add Mention
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Mentions</h2>

        {mentions.map((m: any) => (
          <div key={m.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <p className='font-bold'>Mentioned User: {m.mentioned_user_id}</p>
            <p className='text-sm text-gray-700'>{m.context}</p>
            <p className='text-xs text-gray-500'>{m.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}