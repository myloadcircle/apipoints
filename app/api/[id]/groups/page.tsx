import { createGroup } from '@/server/create-group'
import { listGroups } from '@/server/list-groups'
import { assignToGroup } from '@/server/assign-to-group'
import { listGroupItems } from '@/server/list-group-items'

export default async function GroupsPage({ params, searchParams }: any) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const selectedGroup = searchParams.group || null

  const groups = await listGroups(userId, apiId)
  const items = selectedGroup ? await listGroupItems(selectedGroup, userId) : []

  async function create(formData: FormData) {
    'use server'
    const name = String(formData.get('name'))
    await createGroup(userId, apiId, name)
  }

  async function assign(formData: FormData) {
    'use server'
    const requestId = String(formData.get('requestId'))
    const groupId = String(formData.get('groupId'))
    await assignToGroup(userId, apiId, requestId, groupId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Request Groups</h1>

      <form action={create} className='space-y-4'>
        <input
          name='name'
          placeholder='Group name (e.g. Billing, Onboarding, Experiments)'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Create Group
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Groups</h2>

        {groups.map((g: any) => (
          <div key={g.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
            <p className='font-bold'>{g.name}</p>
            <a
              href={`?group=${g.id}`}
              className='text-blue-600 underline text-sm'
            >
              View
            </a>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold'>Group Items</h2>

          <form action={assign} className='space-y-4'>
            <input
              name='requestId'
              placeholder='Request ID'
              className='border p-2 rounded w-full'
            />
            <input type='hidden' name='groupId' value={selectedGroup} />
            <button className='px-4 py-2 bg-blue-600 text-white rounded'>
              Add to Group
            </button>
          </form>

          <div className='space-y-4'>
            {items.map((i: any) => (
              <div key={i.id} className='border p-4 rounded bg-gray-50'>
                <p className='font-bold'>Request {i.request_id}</p>
                <p className='text-sm text-gray-700'>Status: {i.request?.status}</p>

                <pre className='text-xs bg-white p-3 rounded border whitespace-pre-wrap'>
{JSON.stringify(i.request?.payload, null, 2)}
                </pre>

                <p className='text-xs text-gray-500'>{i.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}