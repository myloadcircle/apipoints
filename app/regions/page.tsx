import { listRegions, getFailoverHistory, updateRegionHealth } from '@/lib/actions/regions'

export const dynamic = 'force-dynamic'

export default async function RegionsPage() {
  const regions = await listRegions(false)
  const failovers = await getFailoverHistory(10)

  const getStatusColor = (status: string) => {
    if (status === 'healthy') return 'bg-green-100 text-green-800'
    if (status === 'degraded') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <div>
        <h1 className='text-2xl font-bold'>Region Mesh</h1>
        <p className='text-gray-600 mt-2'>Multi-region deployment with automatic failover</p>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        {regions.map((r: any) => (
          <div key={r.code} className='border p-4 rounded bg-gray-50'>
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='font-bold'>{r.name}</h3>
                <p className='text-sm text-gray-600'>{r.code}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status)}`}>
                {r.status?.toUpperCase()}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-2 mt-4 text-sm'>
              <div className='bg-white p-2 rounded'>
                <p className='text-gray-600'>Latency</p>
                <p className='font-bold'>{r.latency_ms}ms</p>
              </div>
              <div className='bg-white p-2 rounded'>
                <p className='text-gray-600'>Load</p>
                <p className='font-bold'>{r.load_percentage}%</p>
              </div>
            </div>

            <p className='text-xs text-gray-500 mt-3'>
              Last check: {new Date(r.last_health_check).toLocaleString()}
            </p>

            <form action={async () => {
              'use server'
              await updateRegionHealth(r.code, r.status === 'healthy' ? 'down' : 'healthy')
            }} className='mt-3'>
              <button className={`px-3 py-1 rounded text-sm ${
                r.status === 'healthy' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {r.status === 'healthy' ? 'Simulate Down' : 'Mark Healthy'}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Failover History</h2>
        {failovers.length > 0 ? (
          failovers.map((f: any) => (
            <div key={f.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-bold'>
                    {f.from?.name || f.from_region} → {f.to?.name || f.to_region}
                  </p>
                  <p className='text-sm text-gray-600 mt-1'>{f.reason}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  f.auto_triggered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {f.auto_triggered ? 'AUTO' : 'MANUAL'}
                </span>
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                {new Date(f.created_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No failover events yet.</p>
        )}
      </div>
    </div>
  )
}
