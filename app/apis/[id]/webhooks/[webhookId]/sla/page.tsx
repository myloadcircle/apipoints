import { supabase } from '@/lib/supabase'
import { getSLAPolicy, updateSLAPolicy } from '@/server/webhook-sla'

export const dynamic = 'force-dynamic'

export default async function WebhookSLAPage({ params }: any) {
  const apiId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get webhook details
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  // Get SLA policy
  const policy = await getSLAPolicy(webhookId)

  // Get live metrics (simplified)
  const windowStart = new Date(Date.now() - 60 * 60 * 1000)
  const { data: logs } = await supabase
    .from('api_request_webhook_logs')
    .select('status_code, duration_ms, success')
    .eq('webhook_id', webhookId)
    .gte('created_at', windowStart.toISOString())

  const totalRequests = logs?.length || 0
  const failedRequests = logs?.filter(l => !l.success).length || 0
  const failureRate = totalRequests > 0 ? failedRequests / totalRequests : 0
  const avgLatency = totalRequests > 0 
    ? logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests 
    : 0

  // Get recent breaches
  const { data: breaches } = await supabase
    .from('api_webhook_sla_breaches')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('occurred_at', { ascending: false })
    .limit(20)

  async function updatePolicy(formData: FormData) {
    'use server'
    const updates = {
      sla_enabled: formData.get('sla_enabled') === 'on',
      max_latency_ms: parseInt(String(formData.get('max_latency_ms'))) || 2000,
      max_failure_rate: parseFloat(String(formData.get('max_failure_rate'))) || 0.05,
      evaluation_window_minutes: parseInt(String(formData.get('evaluation_window_minutes'))) || 60,
      auto_escalate: formData.get('auto_escalate') === 'on',
      auto_disable: formData.get('auto_disable') === 'on'
    }

    await updateSLAPolicy(webhookId, userId, updates)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook SLA Monitoring</h1>

      {webhook && (
        <div className='border p-4 rounded bg-gray-50'>
          <p className='font-bold'>{webhook.event}</p>
          <p className='text-sm text-gray-700'>{webhook.url}</p>
        </div>
      )}

      {/* Live Metrics */}
      <div className='grid grid-cols-4 gap-6'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Total Requests (Last 60m)</p>
          <p className='text-3xl font-bold'>{totalRequests}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Avg Latency</p>
          <p className={`text-3xl font-bold ${avgLatency > (policy?.max_latency_ms || 2000) ? 'text-red-600' : 'text-green-600'}`}>
            {Math.round(avgLatency)}ms
          </p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Failure Rate</p>
          <p className={`text-3xl font-bold ${(failureRate || 0) > (policy?.max_failure_rate || 0.05) ? 'text-red-600' : 'text-green-600'}`}>
            {((failureRate || 0) * 100).toFixed(1)}%
          </p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>SLA Status</p>
          <p className={`text-3xl font-bold ${(failureRate || 0) > (policy?.max_failure_rate || 0.05) || avgLatency > (policy?.max_latency_ms || 2000) ? 'text-red-600' : 'text-green-600'}`}>
            {(failureRate || 0) > (policy?.max_failure_rate || 0.05) || avgLatency > (policy?.max_latency_ms || 2000) ? 'BREACH' : 'OK'}
          </p>
        </div>
      </div>

      {/* SLA Configuration */}
      <form action={updatePolicy} className='space-y-6 border p-6 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold'>SLA Configuration</h2>

        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            name='sla_enabled'
            defaultChecked={policy?.sla_enabled || false}
            className='w-4 h-4'
          />
          <label className='font-bold'>Enable SLA Monitoring</label>
        </div>

        <div className='grid grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-bold mb-1'>Max Latency (ms)</label>
            <input
              type='number'
              name='max_latency_ms'
              defaultValue={policy?.max_latency_ms || 2000}
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Max Failure Rate (%)</label>
            <input
              type='number'
              name='max_failure_rate'
              defaultValue={(policy?.max_failure_rate || 0.05) * 100}
              step='0.1'
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Evaluation Window (minutes)</label>
            <input
              type='number'
              name='evaluation_window_minutes'
              defaultValue={policy?.evaluation_window_minutes || 60}
              className='border p-2 rounded w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='auto_escalate'
              defaultChecked={policy?.auto_escalate || false}
              className='w-4 h-4'
            />
            <label>Auto-escalate (send notification on breach)</label>
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='auto_disable'
              defaultChecked={policy?.auto_disable || false}
              className='w-4 h-4'
            />
            <label>Auto-disable webhook on breach</label>
          </div>
        </div>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Save SLA Policy
        </button>
      </form>

      {/* Breach History */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Breach History</h2>

        {breaches && breaches.length > 0 ? (
          <div className='space-y-3'>
            {breaches.map((b: any) => (
              <div key={b.id} className='border p-4 rounded bg-red-50'>
                <div className='flex items-center justify-between'>
                  <span className='px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold'>
                    {b.breach_type.toUpperCase()}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {new Date(b.occurred_at).toLocaleString()}
                  </span>
                </div>
                <p className='text-sm mt-2'>
                  Observed: <strong>{b.observed_value}</strong> / 
                  Threshold: <strong>{b.threshold_value}</strong>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No SLA breaches yet.</p>
        )}
      </div>
    </div>
  )
}
