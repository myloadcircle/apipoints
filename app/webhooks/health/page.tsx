import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function WebhookHealthPage({ params }: any) {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: webhooks, error } = await supabase
    .from('api_request_webhooks')
    .select(`
      *,
      health:api_request_webhook_health(
        last_check_at,
        last_status_code,
        last_success,
        consecutive_failures,
        response_time_ms
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to load webhooks:', error)
  }

  // Process webhooks with health status
  const webhooksWithHealth = (webhooks || []).map(wh => {
    const healthChecks = wh.health || []
    const latestHealth = healthChecks.sort((a: any, b: any) => 
      new Date(b.last_check_at).getTime() - new Date(a.last_check_at).getTime()
    )[0]

    const status = !latestHealth 
      ? 'unknown'
      : latestHealth.last_success 
        ? 'healthy' 
        : latestHealth.consecutive_failures >= 3 
          ? 'unhealthy' 
          : 'warning'

    return {
      ...wh,
      health: latestHealth,
      status
    }
  })

  async function runCheck(formData: FormData) {
    'use server'
    const webhookId = formData.get('webhookId') as string
    const res = await fetch('/api/webhooks/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookId })
    })
    if (!res.ok) throw new Error('Health check failed')
  }

  async function runAllChecks() {
    'use server'
    const res = await fetch('/api/webhooks/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!res.ok) throw new Error('Health checks failed')
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || styles.unknown}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className='p-8 space-y-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Webhook Health Checks</h1>
        <form action={runAllChecks}>
          <button className='px-4 py-2 bg-blue-600 text-white rounded'>
            Run All Checks
          </button>
        </form>
      </div>

      <div className='space-y-6'>
        {webhooksWithHealth.length === 0 ? (
          <p className='text-gray-500'>No webhooks configured yet.</p>
        ) : (
          webhooksWithHealth.map((wh: any) => (
            <div key={wh.id} className='border p-4 rounded bg-gray-50 space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-bold'>{wh.event}</p>
                  <p className='text-sm text-gray-700'>{wh.url}</p>
                </div>
                {statusBadge(wh.status)}
              </div>

              {wh.health ? (
                <div className='grid grid-cols-4 gap-4 text-sm'>
                  <div>
                    <p className='text-gray-600'>Last Check</p>
                    <p className='font-bold'>
                      {new Date(wh.health.last_check_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-600'>Status Code</p>
                    <p className='font-bold'>{wh.health.last_status_code}</p>
                  </div>
                  <div>
                    <p className='text-gray-600'>Response Time</p>
                    <p className='font-bold'>{wh.health.response_time_ms}ms</p>
                  </div>
                  <div>
                    <p className='text-gray-600'>Consecutive Failures</p>
                    <p className={`font-bold ${wh.health.consecutive_failures >= 3 ? 'text-red-600' : ''}`}>
                      {wh.health.consecutive_failures}
                    </p>
                  </div>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No health checks yet</p>
              )}

              <form action={runCheck} className='pt-2'>
                <input type='hidden' name='webhookId' value={wh.id} />
                <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                  Run Check
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
