import { getSystemHealth, getTelemetry, getDiagnostics, triggerMitigation } from '@/lib/actions/telemetry'

export const dynamic = 'force-dynamic'

export default async function ObservabilityPage() {
  const health = await getSystemHealth()
  const telemetry = await getTelemetry(undefined, undefined, 20)
  const diagnostics = await getDiagnostics()

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'bg-red-100 text-red-800'
    if (severity === 'warning') return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className='p-8 space-y-10 max-w-7xl'>
      <div>
        <h1 className='text-2xl font-bold'>Observability & Telemetry</h1>
        <p className='text-gray-600 mt-2'>System health, diagnostics, and predictive insights</p>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Monitored Services</p>
          <p className='text-3xl font-bold mt-1'>{Object.keys(health.services).length}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Open Diagnostics</p>
          <p className='text-3xl font-bold mt-1'>{health.open_diagnostics}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Telemetry Points</p>
          <p className='text-3xl font-bold mt-1'>{telemetry.length}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>System Status</p>
          <p className={`text-3xl font-bold mt-1 ${health.open_diagnostics > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {health.open_diagnostics > 0 ? 'ISSUES' : 'HEALTHY'}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Service Health</h2>
          <div className='space-y-2'>
            {Object.entries(health.services).map(([service, data]: [string, any]) => (
              <div key={service} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{service.replace(/_/g, ' ').toUpperCase()}</h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      Last update: {new Date(data.last_update).toLocaleString()}
                    </p>
                  </div>
                  <div className='text-right text-sm'>
                    <p className={data.latency > 1000 ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {data.latency.toFixed(0)}ms
                    </p>
                    <p className='text-gray-500'>max latency</p>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2 mt-3 text-sm'>
                  <div className='bg-white p-2 rounded'>
                    <span className='text-gray-600'>Error Rate:</span> {(data.error_rate * 100).toFixed(1)}%
                  </div>
                  <div className='bg-white p-2 rounded'>
                    <span className='text-gray-600'>Throughput:</span> {data.throughput.toFixed(0)} req/min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Active Diagnostics ({diagnostics.length})</h2>
          {diagnostics.length > 0 ? (
            diagnostics.map((d: any) => (
              <div key={d.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{d.diagnostic_type.replace(/_/g, ' ')}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(d.severity)}`}>
                      {d.severity?.toUpperCase()}
                    </span>
                    <p className='text-sm text-gray-600 mt-2'>{d.service}</p>
                  </div>
                  <form action={async () => {
                    'use server'
                    await triggerMitigation(d.id, 'alert_only')
                  }}>
                    <button className='px-3 py-1 bg-black text-white rounded text-sm'>
                      Resolve
                    </button>
                  </form>
                </div>
                {d.details && (
                  <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                    {JSON.stringify(d.details, null, 2)}
                  </pre>
                )}
                <p className='text-xs text-gray-500 mt-2'>
                  {new Date(d.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No active diagnostics.</p>
          )}
        </div>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Recent Telemetry</h2>
        <div className='space-y-2'>
          {telemetry.map((t: any) => (
            <div key={t.id} className='border p-3 rounded bg-gray-50 flex items-center justify-between text-sm'>
              <div>
                <span className='font-bold'>{t.service}</span>
                <span className='text-gray-600 ml-2'>{t.metric_type}</span>
              </div>
              <div className='flex items-center gap-4'>
                <span className='font-bold'>{t.value.toFixed(2)}</span>
                <span className='text-xs text-gray-500'>
                  {new Date(t.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
