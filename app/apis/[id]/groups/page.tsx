import { createGroup } from '@/lib/actions/groups'
import { listGroups } from '@/lib/actions/groups'
import { assignRequestToGroup } from '@/lib/actions/groups'
import { listGroupItems } from '@/lib/actions/groups'

export const dynamic = 'force-dynamic'

export default async function GroupsPage({ params, searchParams }: { params: { id: string }, searchParams: { group?: string } }) {
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
    await assignRequestToGroup(userId, apiId, requestId, groupId)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Groups</h1>

      <form action={create} className="space-y-4">
        <input
          name="name"
          placeholder="Group name (e.g. Billing, Experiments, Production)"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Create Group
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Groups</h2>
        {groups.map((g: any) => (
          <a
            key={g.id}
            href={`?group=${g.id}`}
            className="block border p-3 rounded bg-gray-50 hover:bg-gray-100"
          >
            {g.name}
          </a>
        ))}
      </div>

      {selectedGroup && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Group Items</h2>

          <form action={assign} className="space-y-4">
            <input
              name="requestId"
              placeholder="Request ID"
              className="border p-2 rounded w-full"
            />
            <input type="hidden" name="groupId" value={selectedGroup} />
            <button className="px-4 py-2 bg-black text-white rounded">
              Add to Group
            </button>
          </form>

          <div className="space-y-4">
            {items.map((i: any) => (
              <div key={i.id} className="border p-4 rounded bg-white">
                <p className="font-bold">Request {i.request?.request_id}</p>
                <pre className="text-xs bg-gray-50 p-3 rounded border mt-2 overflow-auto">
                  {JSON.stringify(i.request?.payload, null, 2)}
                </pre>
                <p className="text-xs text-gray-500 mt-2">{i.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
