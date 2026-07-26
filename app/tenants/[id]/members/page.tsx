import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function TenantMembersPage({ params }: any) {
  const tenantId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Verify user is member
  const { data: requester, error: reqError } = await supabase
    .from('api_tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (reqError || !requester) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Tenant Members</h1>
        <p className='text-red-600 mt-4'>Unauthorized</p>
      </div>
    )
  }

  const canManage = ['owner', 'admin'].includes(requester.role)

  // Get all members
  const { data: members, error } = await supabase
    .from('api_tenant_members')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  async function addMember(formData: FormData) {
    'use server'
    const newUserId = String(formData.get('user_id'))
    const role = String(formData.get('role')) as any

    const { error: addError } = await supabase
      .from('api_tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: newUserId,
        role
      })

    if (addError) throw new Error('Failed to add member')
  }

  async function changeRole(formData: FormData) {
    'use server'
    const targetUserId = String(formData.get('user_id'))
    const newRole = String(formData.get('role')) as any

    const { error } = await supabase
      .from('api_tenant_members')
      .update({ role: newRole })
      .eq('tenant_id', tenantId)
      .eq('user_id', targetUserId)

    if (error) throw new Error('Failed to change role')
  }

  async function removeMember(formData: FormData) {
    'use server'
    const targetUserId = String(formData.get('user_id'))

    const { error } = await supabase
      .from('api_tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', targetUserId)

    if (error) throw new Error('Failed to remove member')
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Tenant Members</h1>
      <p className='text-sm text-gray-600'>Your role: <strong>{requester.role}</strong></p>

      {canManage && (
        <form action={addMember} className='space-y-4 border p-4 rounded bg-gray-50'>
          <h2 className='text-xl font-semibold'>Invite Member</h2>
          <input
            name='user_id'
            placeholder='User ID'
            className='border p-2 rounded w-full'
          />
          <select name='role' className='border p-2 rounded w-full'>
            <option value='admin'>Admin</option>
            <option value='developer'>Developer</option>
            <option value='auditor'>Auditor</option>
            <option value='viewer'>Viewer</option>
          </select>
          <button className='px-4 py-2 bg-black text-white rounded'>
            Add Member
          </button>
        </form>
      )}

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Members</h2>

        {members && members.length > 0 ? (
          members.map((m: any) => (
            <div key={m.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
              <div>
                <p className='font-bold'>{m.user_id}</p>
                <span className={`px-2 py-1 rounded text-xs ${
                  m.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                  m.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  m.role === 'developer' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {m.role.toUpperCase()}
                </span>
                <p className='text-xs text-gray-500 mt-1'>
                  Joined {new Date(m.created_at).toLocaleString()}
                </p>
              </div>

              {canManage && m.user_id !== userId && (
                <div className='flex gap-2'>
                  <form action={changeRole}>
                    <input type='hidden' name='user_id' value={m.user_id} />
                    <select 
                      name='role' 
                      defaultValue={m.role}
                      className='border p-1 rounded text-xs'
                      onChange={(e) => {
                        const form = e.target.closest('form')
                        if (form) form.requestSubmit()
                      }}
                    >
                      <option value='admin'>Admin</option>
                      <option value='developer'>Developer</option>
                      <option value='auditor'>Auditor</option>
                      <option value='viewer'>Viewer</option>
                    </select>
                  </form>

                  <form action={removeMember}>
                    <input type='hidden' name='user_id' value={m.user_id} />
                    <button className='px-3 py-1 bg-red-600 text-white rounded text-xs'>
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No members yet.</p>
        )}
      </div>
    </div>
  )
}
