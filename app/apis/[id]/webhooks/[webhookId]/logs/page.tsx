import { supabase } from '@/lib/supabase'
import { replayWebhook } from '@/server/replay-webhook'

export const dynamic = 'force-dynamic'

export default async function WebhookLogsPage({ params }: any) {
  const apiId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get webhook details
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  // Get logs
  const { data: logs } = await supabase
    .from('api_request_webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })

  // Get replays
  const { data: replays } = await supabase
    .from('api_request_webhook_replays')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })

  async function replay(formData: FormData) {
    'use server'
    const originalLogId = formData.get('originalLogId') as string || undefined
    await replayWebhook(userId, webhook?.request_id || '', webhookId, originalLogId)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Logs</h1>

      {webhook && (
        <div className='border p-4 rounded bg-gray-50'>
          <p className='font-bold'>{webhook.event}</p>
          <p className='text-sm text-gray-700'>{webhook.url}</p>
        </div>
      )}

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Logs</h2>

        {logs?.map((log: any) => (
          <div key={log.id} className='border p-4 rounded bg-gray-50 space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className={`px-2 py-1 rounded text-xs ${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {log.status_code}
                </span>
                <span className='text-sm'>{log.success ? 'Success' : 'Failed'}</span>
              </div>
              <span className='text-xs text-gray-500'>{log.duration_ms}ms</span>
            </div>

            <p className='text-xs text-gray-600'>Attempt #{log.attempt_number}</p>
            <p className='text-xs text-gray-500'>{new Date(log.created_at).toLocaleString()}</p>

            <details className='text-xs'>
              <summary className='cursor-pointer text-blue-600'>View Details</summary>
              <div className='mt-2 space-y-2'>
                <p className='font-bold'>Request Body:</p>
                <pre className='bg-white p-2 rounded border whitespace-pre-wrap'>
                  {JSON.stringify(log.request_body, null, 2)}
                </pre>
                <p className='font-bold'>Response:</p>
                <pre className='bg-white p-2 rounded border whitespace-pre-wrap'>
                  {log.response_body}
                </pre>
                {log.error_message && (
                  <p className='text-red-600'>Error: {log.error_message}</p>
                )}
              </div>
            </details>

            <form action={replay}>
              <input type='hidden' name='originalLogId' value={log.id} />
              <button className='px-3 py-1 bg-blue-600 text-white rounded text-sm'>
                Replay
              </button>
            </form>
          </div>
        ))}

        {(!logs || logs.length === 0) && (
          <p className='text-gray-500'>No logs yet.</p>
        )}
      </div>

      {replays && replays.length > 0 && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold'>Replays</h2>

          {replays.map((replay: any) => (
            <div key={replay.id} className='border p-4 rounded bg-blue-50 space-y-2'>
              <div className='flex items-center gap-2'>
                <span className={`px-2 py-1 rounded text-xs ${replay.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {replay.status_code}
                </span>
                <span className='text-sm'>{replay.success ? 'Success' : 'Failed'}</span>
              </div>
              <p className='text-xs text-gray-600'>Replay of log: {replay.original_log_id}</p>
              <p className='text-xs text-gray-500'>{new Date(replay.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
