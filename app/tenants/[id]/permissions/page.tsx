import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function TenantPermissionsPage({ params }: any) {
  const tenantId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Verify user is admin/owner
  const { data: requester, error: reqError } = await supabase
    .from('api_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (reqError || !requester || !['owner', 'admin'].includes(requester.role)) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Tenant Permissions</h1>
        <p className='text-red-600 mt-4'>Insufficient permissions</p>
      </div>
    )
  }

  // Get all permissions
  const { data: permissions, error } = await supabase
    .from('api_tenant_permissions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  async function addPermission(formData: FormData) {
    'use server'
    const resource_type = String(formData.get('resource_type'))
    const resource_id = String(formData.get('resource_id')) || null
    const role_required = String(formData.get('role_required'))

    const { error: addError } = await supabase
      .from('api_tenant_permissions')
      .insert({
        tenant_id: tenantId,
        resource_type,
        resource_id,
        role_required
      })

    if (addError) throw new Error('Failed to add permission')
  }

  async function removePermission(formData: FormData) {
    'use server'
    const permissionId = String(formData.get('permission_id'))

    const { error } = await supabase
      .from('api_tenant_permissions')
      .delete()
      .eq('id', permissionId)

    if (error) throw new Error('Failed to remove permission')
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Tenant Permissions</h1>

      <form action={addPermission} className='space-y-4 border p-4 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold'>Assign Permission</h2>

        <select name='resource_type' className='border p-2 rounded w-full'>
          <option value='request'>Request</option>
          <option value='webhook'>Webhook</option>
          <option value='logs'>Logs</option>
          <option value='metrics'>Metrics</option>
          <option value='secrets'>Secrets</option>
        </select>

        <input
          name='resource_id'
          placeholder='Resource ID (optional - leave empty for all)'
          className='border p-2 rounded w-full'
        />

        <select name='role_required' className='border p-2 rounded w-full'>
          <option value='owner'>Owner</option>
          <option value='admin'>Admin</option>
          <option value='developer'>Developer</option>
          <option value='auditor'>Auditor</option>
          <option value='viewer'>Viewer</option>
        </select>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Assign Permission
        </button>
      </form>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Permissions Matrix</h2>

        {permissions && permissions.length > 0 ? (
          permissions.map((p: any) => (
            <div key={p.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
              <div>
                <p className='font-bold'>{p.resource_type}</p>
                {p.resource_id && (
                  <p className='text-sm text-gray-700'>Resource: {p.resource_id}</p>
                )}
                <span className='px-2 py-1 rounded text-xs bg-blue-100 text-blue-800'>
                  Requires: {p.role_required}
                </span>
                <p className='text-xs text-gray-500 mt-1'>
                  Added {new Date(p.created_at).toLocaleString()}
                </p>
              </div>

              <form action={removePermission}>
                <input type='hidden' name='permission_id' value={p.id} />
                <button className='px-3 py-1 bg-red-600 text-white rounded text-xs'>
                  Remove
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No permissions assigned yet.</p>
        )}
      </div>
    </div>
  )
}
