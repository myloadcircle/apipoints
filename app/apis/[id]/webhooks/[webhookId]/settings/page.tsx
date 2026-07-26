import { supabase } from '@/lib/supabase'
import { RetryPolicy } from '@/server/webhook-retry-policy'

export const dynamic = 'force-dynamic'

export default async function WebhookSettingsPage({ params }: any) {
  const apiId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get webhook with policy
  const { data: webhook, error } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (error || !webhook) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>Webhook Settings</h1>
        <p className='text-red-600 mt-4'>Webhook not found or unauthorized</p>
      </div>
    )
  }

  const policy: RetryPolicy = {
    retry_enabled: webhook.retry_enabled ?? true,
    max_attempts: webhook.max_attempts ?? 3,
    retry_strategy: webhook.retry_strategy ?? 'exponential',
    retry_interval_seconds: webhook.retry_interval_seconds ?? 30,
    backoff_factor: webhook.backoff_factor ?? 2.0,
    max_retry_duration_seconds: webhook.max_retry_duration_seconds ?? 600,
    retry_on_status_codes: webhook.retry_on_status_codes ?? [500, 502, 503, 504],
    retry_on_timeout: webhook.retry_on_timeout ?? true,
    retry_on_network_error: webhook.retry_on_network_error ?? true
  }

  async function updatePolicy(formData: FormData) {
    'use server'
    const updates = {
      retry_enabled: formData.get('retry_enabled') === 'on',
      max_attempts: parseInt(String(formData.get('max_attempts'))) || 3,
      retry_strategy: String(formData.get('retry_strategy')) as RetryPolicy['retry_strategy'],
      retry_interval_seconds: parseInt(String(formData.get('retry_interval_seconds'))) || 30,
      backoff_factor: parseFloat(String(formData.get('backoff_factor'))) || 2.0,
      max_retry_duration_seconds: parseInt(String(formData.get('max_retry_duration_seconds'))) || 600,
      retry_on_status_codes: JSON.stringify(
        String(formData.get('retry_on_status_codes'))
          .split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n))
      ),
      retry_on_timeout: formData.get('retry_on_timeout') === 'on',
      retry_on_network_error: formData.get('retry_on_network_error') === 'on'
    }

    const { error: updateError } = await supabase
      .from('api_request_webhooks')
      .update(updates)
      .eq('id', webhookId)
      .eq('user_id', userId)

    if (updateError) throw new Error('Failed to update policy')
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Retry Policy</h1>

      <div className='border p-4 rounded bg-gray-50'>
        <h2 className='text-xl font-semibold mb-2'>{webhook.event}</h2>
        <p className='text-sm text-gray-700'>{webhook.url}</p>
      </div>

      <form action={updatePolicy} className='space-y-6'>
        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            name='retry_enabled'
            defaultChecked={policy.retry_enabled}
            className='w-4 h-4'
          />
          <label className='font-bold'>Enable Retries</label>
        </div>

        <div className='grid grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-bold mb-1'>Max Attempts</label>
            <input
              type='number'
              name='max_attempts'
              defaultValue={policy.max_attempts}
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Retry Strategy</label>
            <select
              name='retry_strategy'
              defaultValue={policy.retry_strategy}
              className='border p-2 rounded w-full'
            >
              <option value='immediate'>Immediate</option>
              <option value='linear'>Linear</option>
              <option value='exponential'>Exponential</option>
              <option value='custom'>Custom</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Retry Interval (seconds)</label>
            <input
              type='number'
              name='retry_interval_seconds'
              defaultValue={policy.retry_interval_seconds}
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Backoff Factor</label>
            <input
              type='number'
              name='backoff_factor'
              defaultValue={policy.backoff_factor}
              step='0.1'
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Max Retry Duration (seconds)</label>
            <input
              type='number'
              name='max_retry_duration_seconds'
              defaultValue={policy.max_retry_duration_seconds}
              className='border p-2 rounded w-full'
            />
          </div>

          <div>
            <label className='block text-sm font-bold mb-1'>Retry on Status Codes (comma-separated)</label>
            <input
              name='retry_on_status_codes'
              defaultValue={policy.retry_on_status_codes.join(', ')}
              className='border p-2 rounded w-full'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='retry_on_timeout'
              defaultChecked={policy.retry_on_timeout}
              className='w-4 h-4'
            />
            <label>Retry on Timeout</label>
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='retry_on_network_error'
              defaultChecked={policy.retry_on_network_error}
              className='w-4 h-4'
            />
            <label>Retry on Network Error</label>
          </div>
        </div>

        <button className='px-4 py-2 bg-black text-white rounded'>
          Save Policy
        </button>
      </form>
    </div>
  )
}
