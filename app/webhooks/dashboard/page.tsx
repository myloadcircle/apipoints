import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getMetrics() {
  const res = await fetch('/api/webhooks/metrics')
  if (!res.ok) return null
  return res.json()
}

export default async function WebhookDashboardPage() {
  const metrics = await getMetrics()

  if (!metrics) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Webhook Dashboard</h1>
        <p className='text-red-600 mt-4'>Failed to load metrics</p>
      </div>
    )
  }

  const successRate = metrics.success_count + metrics.failure_count > 0
    ? Math.round((metrics.success_count / (metrics.success_count + metrics.failure_count)) * 100)
    : 0

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Delivery Dashboard</h1>

      {/* KPI Cards */}
      <div className='grid grid-cols-4 gap-6'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Success Rate</p>
          <p className='text-3xl font-bold text-green-600'>{successRate}%</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Total Sent</p>
          <p className='text-3xl font-bold'>{metrics.success_count + metrics.failure_count}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Failures</p>
          <p className='text-3xl font-bold text-red-600'>{metrics.failure_count}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Avg Duration</p>
          <p className='text-3xl font-bold'>{metrics.avg_duration}ms</p>
        </div>
      </div>

      {/* Status Code Distribution */}
      <div className='border p-6 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold mb-4'>Status Code Distribution</h2>
        <div className='space-y-2'>
          {Object.entries(metrics.status_code_histogram || {}).map(([code, count]: [string, any]) => (
            <div key={code} className='flex items-center gap-4'>
              <span className='w-12 text-sm font-bold'>{code}</span>
              <div className='flex-1 bg-gray-200 rounded-full h-6 overflow-hidden'>
                <div
                  className={`h-full ${code.startsWith('2') ? 'bg-green-500' : code.startsWith('4') ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(count / (metrics.success_count + metrics.failure_count)) * 100}%` }}
                />
              </div>
              <span className='text-sm text-gray-600'>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Failures */}
      <div className='border p-6 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold mb-4'>Recent Failures (Last 24h)</h2>
        {metrics.recent_failures?.length > 0 ? (
          <div className='space-y-3'>
            {metrics.recent_failures.map((f: any) => (
              <div key={f.id} className='border p-3 rounded bg-white'>
                <div className='flex items-center justify-between'>
                  <span className='px-2 py-1 bg-red-100 text-red-800 rounded text-xs'>
                    {f.status_code}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {new Date(f.created_at).toLocaleString()}
                  </span>
                </div>
                <p className='text-sm mt-2'>{f.url}</p>
                {f.error_message && (
                  <p className='text-xs text-red-600 mt-1'>{f.error_message}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No recent failures</p>
        )}
      </div>

      {/* Slowest Webhooks */}
      <div className='border p-6 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold mb-4'>Slowest Webhooks</h2>
        {metrics.slowest_webhooks?.length > 0 ? (
          <div className='space-y-3'>
            {metrics.slowest_webhooks.map((w: any) => (
              <div key={w.id} className='border p-3 rounded bg-white flex items-center justify-between'>
                <div>
                  <p className='text-sm font-bold'>{w.url}</p>
                  <p className='text-xs text-gray-500'>{w.status_code}</p>
                </div>
                <span className='text-lg font-bold'>{w.duration_ms}ms</span>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No data yet</p>
        )}
      </div>

      {/* Retry & Replay Stats */}
      <div className='grid grid-cols-2 gap-6'>
        <div className='border p-6 rounded bg-gray-50'>
          <h2 className='text-xl font-semibold mb-4'>Retry Statistics</h2>
          <p className='text-sm text-gray-600'>Total Retries: <strong>{metrics.retry_stats?.total_retries || 0}</strong></p>
          <p className='text-sm text-gray-600'>Max Attempts: <strong>{metrics.retry_stats?.max_attempts || 0}</strong></p>
        </div>

        <div className='border p-6 rounded bg-gray-50'>
          <h2 className='text-xl font-semibold mb-4'>Replay Statistics</h2>
          <p className='text-sm text-gray-600'>Total Replays: <strong>{metrics.replay_stats?.total_replays || 0}</strong></p>
          <p className='text-sm text-gray-600'>Successful: <strong className='text-green-600'>{metrics.replay_stats?.success_replays || 0}</strong></p>
        </div>
      </div>
    </div>
  )
}
