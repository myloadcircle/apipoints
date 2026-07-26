import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function TenantSwitcherPage() {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: tenants, error } = await supabase
    .from('api_tenant_members')
    .select('tenant:tenant_id(id, name, created_at)')
    .eq('user_id', userId)

  if (error) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Tenant Switcher</h1>
        <p className='text-red-600 mt-4'>Failed to load tenants</p>
      </div>
    )
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Tenant Switcher</h1>

      <div className='space-y-4'>
        {tenants && tenants.length > 0 ? (
          tenants.map((t: any) => (
            <div key={t.tenant.id} className='border p-4 rounded bg-gray-50 flex items-center justify-between'>
              <div>
                <p className='font-bold'>{t.tenant.name}</p>
                <p className='text-xs text-gray-500'>
                  {new Date(t.tenant.created_at).toLocaleString()}
                </p>
              </div>
              <form>
                <button 
                  className='px-3 py-1 bg-black text-white rounded text-sm'
                  formAction={async () => {
                    'use server'
                    // Set active tenant in cookie/session
                    console.log('Switch to tenant:', t.tenant.id)
                  }}
                >
                  Switch
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No tenants found.</p>
        )}
      </div>
    </div>
  )
}
