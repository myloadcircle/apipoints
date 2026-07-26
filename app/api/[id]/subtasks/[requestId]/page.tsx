import { createSubtask } from '@/server/create-subtask'
import { listSubtasks } from '@/server/list-subtasks'
import { toggleSubtask } from '@/server/toggle-subtask'

export default async function SubtasksPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const subtasks = await listSubtasks(requestId, userId)

  async function create(formData: FormData) {
    'use server'
    const title = String(formData.get('title'))
    await createSubtask(userId, apiId, requestId, title)
  }

  async function toggle(formData: FormData) {
    'use server'
    const subtaskId = String(formData.get('subtaskId'))
    const completed = formData.get('completed') === 'true'
    await toggleSubtask(userId, subtaskId, completed)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Subtasks</h1>

      <form action={create} className='space-y-4'>
        <input
          name='title'
          placeholder='Subtask title'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Add Subtask
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Subtask List</h2>

        {subtasks.map((s: any) => (
          <div key={s.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
            <div>
              <p className='font-bold'>{s.title}</p>
              <p className='text-xs text-gray-500'>{s.created_at}</p>
            </div>

            <form action={toggle}>
              <input type='hidden' name='subtaskId' value={s.id} />
              <input type='hidden' name='completed' value={(!s.completed).toString()} />
              <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                {s.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}