import { getHealPolicies, getOptimizations, getHealingEvents, toggleHealPolicy, applyOptimization, generateOptimizations } from '@/lib/actions/self-heal'

export const dynamic = 'force-dynamic'

export default async function SelfHealPage() {
  const policies = await getHealPolicies()
  const optimizations = await getOptimizations(undefined, false)
  const events = await getHealingEvents(undefined, 10)

  return (
    <div className='p-8 space-y-10 max-w-7xl'>
      <div>
        <h1 className='text-2xl font-bold'>Self-Healing & Auto-Optimisation</h1>
        <p className='text-gray-600 mt-2'>Automated remediation and performance optimization</p>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Active Policies</p>
          <p className='text-3xl font-bold mt-1'>{policies.filter(p => p.enabled).length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Pending Optimizations</p>
          <p className='text-3xl font-bold mt-1'>{optimizations.length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Healing Events</p>
          <p className='text-3xl font-bold mt-1'>{events.length}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <form action={async () => {
            'use server'
            await generateOptimizations()
          }}>
            <button className='px-4 py-2 bg-black text-white rounded text-sm'>
              Generate
            </button>
          </form>
          <p className='text-sm text-gray-600 mt-2'>New Optimizations</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Heal Policies ({policies.length})</h2>
          {policies.map((p: any) => (
            <div key={p.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-bold'>{p.name}</h3>
                  <p className='text-sm text-gray-600'>{p.service}</p>
                </div>
                <form action={async () => {
                  'use server'
                  await toggleHealPolicy(p.id, !p.enabled)
                }}>
                  <button className={`px-3 py-1 rounded text-sm text-white ${p.enabled ? 'bg-green-600' : 'bg-gray-400'}`}>
                    {p.enabled ? 'ON' : 'OFF'}
                  </button>
                </form>
              </div>
              <div className='mt-3 text-xs bg-white p-3 rounded'>
                <p className='font-bold'>Trigger:</p>
                <pre>{JSON.stringify(p.trigger_condition, null, 2)}</pre>
                <p className='font-bold mt-2'>Actions:</p>
                <pre>{JSON.stringify(p.healing_actions, null, 2)}</pre>
              </div>
              {p.last_triggered && (
                <p className='text-xs text-gray-500 mt-2'>
                  Last triggered: {new Date(p.last_triggered).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Pending Optimizations</h2>
          {optimizations.length > 0 ? (
            optimizations.map((o: any) => (
              <div key={o.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{o.optimization_type.replace(/_/g, ' ')}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      o.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      o.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {o.priority?.toUpperCase()}
                    </span>
                    <p className='text-sm text-gray-600 mt-1'>{o.service}</p>
                  </div>
                  <form action={async () => {
                    'use server'
                    await applyOptimization(o.id)
                  }}>
                    <button className='px-3 py-1 bg-black text-white rounded text-sm'>
                      Apply
                    </button>
                  </form>
                </div>
                {o.current_config && (
                  <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                    <div className='bg-white p-2 rounded'>
                      <p className='font-bold'>Current:</p>
                      <pre>{JSON.stringify(o.current_config, null, 2)}</pre>
                    </div>
                    <div className='bg-white p-2 rounded'>
                      <p className='font-bold'>Recommended:</p>
                      <pre>{JSON.stringify(o.recommended_config, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {o.impact_score && (
                  <p className='text-xs text-gray-600 mt-2'>Impact: {(o.impact_score * 100).toFixed(0)}%</p>
                )}
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No pending optimizations.</p>
          )}

          <h2 className='text-xl font-bold mt-6'>Recent Healing Events</h2>
          {events.map((e: any) => (
            <div key={e.id} className='border p-3 rounded bg-gray-50 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-bold'>{e.service}</span>
                <span className={e.success ? 'text-green-600' : 'text-red-600'}>
                  {e.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {e.trigger_reason && <p className='text-gray-600 mt-1'>{e.trigger_reason}</p>}
              {e.policy && <p className='text-xs text-gray-500'>Policy: {e.policy.name}</p>}
              <p className='text-xs text-gray-500 mt-1'>{new Date(e.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
