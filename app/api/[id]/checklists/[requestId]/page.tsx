import { createChecklist } from '@/server/create-checklist'
import { addChecklistItem } from '@/server/add-checklist-item'
import { toggleChecklistItem } from '@/server/toggle-checklist-item'
import { listChecklists } from '@/server/list-checklists'

export default async function ChecklistsPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const checklists = await listChecklists(requestId, userId)

  async function create(formData: FormData) {
    'use server'
    const title = String(formData.get('title'))
    await createChecklist(userId, apiId, requestId, title)
  }

  async function addItem(formData: FormData) {
    'use server'
    const checklistId = String(formData.get('checklistId'))
    const text = String(formData.get('text'))
    await addChecklistItem(checklistId, text)
  }

  async function toggle(formData: FormData) {
    'use server'
    const itemId = String(formData.get('itemId'))
    const completed = formData.get('completed') === 'true'
    await toggleChecklistItem(itemId, completed)
  }

  return (
    <div className='p-8 space-y-12'>
      <h1 className='text-2xl font-bold'>Checklists</h1>

      <form action={create} className='space-y-4'>
        <input
          name='title'
          placeholder='Checklist title'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Create Checklist
        </button>
      </form>

      <div className='space-y-10'>
        {checklists.map((c: any) => (
          <div key={c.id} className='border p-4 rounded bg-gray-50 space-y-4'>
            <h2 className='text-xl font-semibold'>{c.title}</h2>

            <form action={addItem} className='space-y-2'>
              <input type='hidden' name='checklistId' value={c.id} />
              <input
                name='text'
                placeholder='Add item'
                className='border p-2 rounded w-full'
              />
              <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                Add Item
              </button>
            </form>

            <div className='space-y-3'>
              {c.items.map((i: any) => (
                <div key={i.id} className='flex items-center justify-between border p-3 rounded bg-white'>
                  <p className={i.completed ? 'line-through text-gray-500' : ''}>
                    {i.text}
                  </p>

                  <form action={toggle}>
                    <input type='hidden' name='itemId' value={i.id} />
                    <input type='hidden' name='completed' value={(!i.completed).toString()} />
                    <button className='px-3 py-1 bg-green-600 text-white rounded text-sm'>
                      {i.completed ? 'Undo' : 'Complete'}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}