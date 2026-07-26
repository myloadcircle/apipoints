import { getIdentityProviders, getAccessKeys, getAccessPolicies, generateAccessKey, revokeAccessKey, createAccessPolicy, getAccessPolicies as getPolicies } from '@/lib/actions/identity'
import { createIdentityProvider, linkUserIdentity, rotateAccessKey } from '@/lib/actions/identity'

export const dynamic = 'force-dynamic'

export default async function IdentityPage() {
  const providers = await getIdentityProviders()
  const policies = await getPolicies()
  // Note: In production, get user ID from session
  const dummyUserId = '00000000-0000-0000-0000-000000000000'
  const accessKeys = await getAccessKeys(dummyUserId)

  return (
    <div className='p-8 space-y-10 max-w-7xl'>
      <div>
        <h1 className='text-2xl font-bold'>Unified Identity & Access</h1>
        <p className='text-gray-600 mt-2'>Manage identities, access keys, and permissions</p>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Identity Providers</p>
          <p className='text-3xl font-bold mt-1'>{providers.length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Active Access Keys</p>
          <p className='text-3xl font-bold mt-1'>{accessKeys.length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Access Policies</p>
          <p className='text-3xl font-bold mt-1'>{policies.length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <form action={async () => {
            'use server'
            await generateAccessKey(dummyUserId, 'Default API Key', ['read', 'write'], 365)
          }}>
            <button className='px-4 py-2 bg-black text-white rounded text-sm'>
              Generate Key
            </button>
          </form>
          <p className='text-sm text-gray-600 mt-2'>New Access Key</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Identity Providers</h2>
          {providers.map((p: any) => (
            <div key={p.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-bold'>{p.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    p.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {p.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className='text-sm text-gray-600'>{p.type}</p>
              </div>
              {p.config && Object.keys(p.config).length > 0 && (
                <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                  {JSON.stringify(p.config, null, 2)}
                </pre>
              )}
            </div>
          ))}

          <h2 className='text-xl font-bold mt-6'>Access Policies</h2>
          {policies.map((p: any) => (
            <div key={p.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-bold'>{p.name}</h3>
                  <p className='text-sm text-gray-600'>{p.resource_type}</p>
                </div>
                <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                  Priority: {p.priority}
                </span>
              </div>
              <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                {JSON.stringify(p.permissions, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Access Keys</h2>
          {accessKeys.length > 0 ? (
            accessKeys.map((k: any) => (
              <div key={k.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{k.name}</h3>
                    <p className='text-sm text-gray-600'>
                      Permissions: {k.permissions.join(', ')}
                    </p>
                  </div>
                  <form action={async () => {
                    'use server'
                    await revokeAccessKey(k.id)
                  }}>
                    <button className='px-3 py-1 bg-red-600 text-white rounded text-sm'>
                      Revoke
                    </button>
                  </form>
                </div>
                <div className='mt-3 text-xs space-y-1'>
                  {k.expires_at && (
                    <p className='text-gray-600'>
                      Expires: {new Date(k.expires_at).toLocaleString()}
                    </p>
                  )}
                  {k.last_used_at && (
                    <p className='text-gray-600'>
                      Last used: {new Date(k.last_used_at).toLocaleString()}
                    </p>
                  )}
                  <p className='text-gray-500'>
                    Created: {new Date(k.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No access keys generated.</p>
          )}
        </div>
      </div>
    </div>
  )
}
