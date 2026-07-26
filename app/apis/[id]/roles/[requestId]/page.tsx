import { setRequestRole } from '@/lib/actions/request-roles'
import { listRolesForRequest } from '@/lib/actions/request-roles'

export const dynamic = 'force-dynamic'

export default async function RolesPage({ params }: { params: { id: string; requestId: string } }) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const roles = await listRolesForRequest(requestId, userId)

  async function action(formData: FormData) {
    'use server'
    const role = String(formData.get('role'))
    await setRequestRole(userId, apiId, requestId, role)
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Request Roles</h1>

      <form action={action} className="space-y-4">
        <select name="role" className="border p-2 rounded w-full">
          <option value="system">system</option>
          <option value="user">user</option>
          <option value="assistant">assistant</option>
        </select>
        <button className="px-4 py-2 bg-black text-white rounded">
          Assign Role
        </button>
      </form>

      <div className="space-y-4">
        {roles.map((r: any) => (
          <div key={r.id} className="border p-4 rounded bg-gray-50">
            <p className="font-bold">Role: {r.role}</p>
            <p className="text-xs text-gray-500">{r.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
