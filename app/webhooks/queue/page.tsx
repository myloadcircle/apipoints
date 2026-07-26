import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function WebhookQueuePage() {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get queue stats
  const statsRes = await fetch('/api/webhooks/queue?stats=true')
  const stats = statsRes.ok ? await statsRes.json() : null

  // Get queue items
  const queueRes = await fetch('/api/webhooks/queue')
  const queueData = queueRes.ok ? await queueRes.json() : { queue: [] }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Webhook Queue</h1>

      {/* Stats Cards */}
      <div className='grid grid-cols-4 gap-6'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Pending</p>
          <p className='text-3xl font-bold text-yellow-600'>{stats?.pending_count || 0}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Processing</p>
          <p className='text-3xl font-bold text-blue-600'>{stats?.processing_count || 0}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Failed</p>
          <p className='text-3xl font-bold text-red-600'>{stats?.failed_count || 0}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Avg Wait (ms)</p>
          <p className='text-3xl font-bold'>{stats?.avg_wait_time || 0}</p>
        </div>
      </div>

      {/* Queue Items */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Queue Items</h2>

        {queueData.queue.length === 0 ? (
          <p className='text-gray-500'>No items in queue</p>
        ) : (
          queueData.queue.map((item: any) => (
            <div key={item.id} className='border p-4 rounded bg-gray-50 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {statusBadge(item.status)}
                  <span className='text-sm font-bold'>Attempt #{item.attempt_number}</span>
                </div>
                <span className='text-xs text-gray-500'>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              <p className='text-sm text-gray-700'>{item.url}</p>

              {item.error_message && (
                <p className='text-xs text-red-600'>{item.error_message}</p>
              )}

              <div className='text-xs text-gray-500'>
                <p>Scheduled: {new Date(item.scheduled_at).toLocaleString()}</p>
                {item.locked_by && <p>Locked by: {item.locked_by}</p>}
              </div>

              <details className='text-xs'>
                <summary className='cursor-pointer text-blue-600'>View Payload</summary>
                <pre className='bg-white p-3 rounded border mt-2 whitespace-pre-wrap'>
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
