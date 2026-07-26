import { supabase } from '@/lib/supabase'
import TimelineEvent from '@/components/TimelineEvent'

export const dynamic = 'force-dynamic'

export default async function TimelinePage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId || params.id // Handle both scenarios
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: activities, error } = await supabase
    .from('api_request_activity')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load timeline:', error)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Timeline</h1>

      <div className='space-y-2'>
        {activities?.map((event: any) => (
          <TimelineEvent
            key={event.id}
            type={event.type}
            payload={event.payload}
            created_at={event.created_at}
            actor_id={event.actor_id}
          />
        ))}

        {(!activities || activities.length === 0) && (
          <p className='text-gray-500'>No timeline events yet.</p>
        )}
      </div>
    </div>
  )
}
