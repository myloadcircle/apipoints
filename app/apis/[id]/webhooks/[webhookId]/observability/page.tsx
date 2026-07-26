import { supabase } from '@/lib/supabase'
import { getObservabilityMetrics, getTraces } from '@/server/webhook-observability'

export const dynamic = 'force-dynamic'

export default async function ObservabilityPage({ params }: any) {
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

  // Get metrics
  const metrics = await getObservabilityMetrics(webhookId, userId)

  // Get recent traces
  const traces = await getTraces(webhookId, userId, 20)

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Observability</h1>

      {webhook && (
        <div className='border p-4 rounded bg-gray-50'>
          <p className='font-bold'>{webhook.event}</p>
          <p className='text-sm text-gray-700'>{webhook.url}</p>
        </div>
      )}

      {/* Metrics Dashboard */}
      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Metrics (Last 24h)</h2>
        
        <div className='grid grid-cols-4 gap-6'>
          <div className='border p-4 rounded bg-gray-50'>
            <p className='text-sm text-gray-600'>Avg Latency</p>
            <p className='text-3xl font-bold'>
              {metrics?.hourly?.[0]?.delivery_latency_p50 || 0}ms
            </p>
          </div>

          <div className='border p-4 rounded bg-gray-50'>
            <p className='text-sm text-gray-600'>P95 Latency</p>
            <p className='text-3xl font-bold text-yellow-600'>
              {metrics?.hourly?.[0]?.delivery_latency_p95 || 0}ms
            </p>
          </div>

          <div className='border p-4 rounded bg-gray-50'>
            <p className='text-sm text-gray-600'>P99 Latency</p>
            <p className='text-3xl font-bold text-red-600'>
              {metrics?.hourly?.[0]?.delivery_latency_p99 || 0}ms
            </p>
          </div>

          <div className='border p-4 rounded bg-gray-50'>
            <p className='text-sm text-gray-600'>Total Requests</p>
            <p className='text-3xl font-bold'>
              {metrics?.daily?.[0]?.total_requests || 0}
            </p>
          </div>
        </div>

        {/* Hourly Latency Chart (simplified) */}
        <div className='border p-6 rounded bg-gray-50'>
          <h3 className='font-bold mb-4'>Latency Trend (24h)</h3>
          <div className='space-y-2'>
            {metrics?.hourly?.slice(0, 24).reverse().map((h: any, i: number) => (
              <div key={i} className='flex items-center gap-4'>
                <span className='text-xs text-gray-500 w-20'>
                  {new Date(h.hour).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className='flex-1 bg-gray-200 rounded-full h-6 overflow-hidden'>
                  <div
                    className='h-full bg-blue-500'
                    style={{ width: `${Math.min(100, (h.delivery_latency_p50 || 0) / 10)}%` }}
                  />
                </div>
                <span className='text-xs w-20 text-right'>{h.delivery_latency_p50 || 0}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trace Explorer */}
      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Recent Traces</h2>

        {traces && traces.length > 0 ? (
          <div className='space-y-3'>
            {traces.map((trace: any) => (
              <details key={trace.trace_id} className='border p-4 rounded bg-gray-50'>
                <summary className='cursor-pointer font-bold'>
                  Trace: {trace.trace_id.slice(0, 8)}... 
                  <span className='text-sm font-normal text-gray-600 ml-4'>
                    {new Date(trace.started_at).toLocaleString()}
                  </span>
                  <span className='text-sm font-normal ml-4'>
                    {trace.duration_ms || 0}ms
                  </span>
                </summary>
                
                <div className='mt-4 space-y-2'>
                  {trace.steps?.map((step: any, idx: number) => (
                    <div key={idx} className='flex items-center gap-4 text-sm'>
                      <div className='w-32 text-gray-500'>{step.name}</div>
                      <div className='flex-1 bg-gray-200 rounded h-4'>
                        <div
                          className='h-full bg-green-500'
                          style={{ width: `${(step.duration_ms || 0) / 100}%` }}
                        />
                      </div>
                      <div className='w-20 text-right'>{step.duration_ms || 0}ms</div>
                    </div>
                  ))}
                  
                  {trace.steps && (
                    <div className='text-xs text-gray-600 mt-2'>
                      Total: {trace.duration_ms || 0}ms across {trace.steps.length} steps
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No traces yet.</p>
        )}
      </div>
    </div>
  )
}
