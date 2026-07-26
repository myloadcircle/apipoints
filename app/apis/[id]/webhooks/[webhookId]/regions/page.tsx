import { supabase } from '@/lib/supabase'
import { getRegionMetrics } from '@/server/webhook-region'

export const dynamic = 'force-dynamic'

export default async function WebhookRegionsPage({ params }: any) {
  const apiId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get webhook config
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('preferred_region, failover_regions, region_strategy')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (error || !webhook) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Webhook Regions</h1>
        <p className='text-red-600 mt-4'>Webhook not found or unauthorized</p>
      </div>
    )
  }

  // Get region metrics
  const metrics = await getRegionMetrics(webhookId)

  async function updateConfig(formData: FormData) {
    'use server'
    const preferred_region = formData.get('preferred_region') as string
    const region_strategy = formData.get('region_strategy') as string
    const failover_regions = (formData.get('failover_regions') as string)
      .split(',')
      .map(r => r.trim())
      .filter(r => r)

    const res = await fetch(`/api/webhooks/${webhookId}/regions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferred_region,
        region_strategy,
        failover_regions
      })
    })

    if (!res.ok) throw new Error('Failed to update region config')
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Multi-Region Settings</h1>

      <form action={updateConfig} className='space-y-6'>
        <div>
          <label className='block text-sm font-bold mb-1'>Preferred Region</label>
          <select
            name='preferred_region'
            defaultValue={webhook.preferred_region || 'eu-west'}
            className='border p-2 rounded w-full'
          >
            <option value='eu-west'>EU West</option>
            <option value='us-east'>US East</option>
            <option value='ap-south'>AP South</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-bold mb-1'>Region Strategy</label>
          <select
            name='region_strategy'
            defaultValue={webhook.region_strategy || 'primary'}
            className='border p-2 rounded w-full'
          >
            <option value='primary'>Primary Only</option>
            <option value='round_robin'>Round Robin</option>
            <option value='geo_ip'>Geo IP (Auto-detect)</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-bold mb-1'>Failover Regions (comma-separated)</label>
          <input
            name='failover_regions'
            defaultValue={(webhook.failover_regions || ['us-east', 'ap-south']).join(', ')}
            className='border p-2 rounded w-full'
          />
        </div>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Save Region Settings
        </button>
      </form>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Region Metrics</h2>
        <div className='grid grid-cols-3 gap-6'>
          {metrics.map((m: any) => (
            <div key={m.region} className='border p-4 rounded bg-gray-50'>
              <h3 className='font-bold'>{m.region}</h3>
              <div className='space-y-2 mt-2 text-sm'>
                <p>Latency: <strong>{Math.round(m.latency_ms)}ms</strong></p>
                <p>Success Rate: <strong>{(m.success_rate * 100).toFixed(1)}%</strong></p>
                <p>Failovers: <strong>{m.failover_count}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
