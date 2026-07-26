import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const activityConfig: Record<string, { icon: string; message: (p: any) => string }> = {
  comment_created: { icon: '💬', message: (p) => `Comment added: "${p.message?.slice(0, 50)}..."` },
  comment_deleted: { icon: '🗑️', message: () => 'Comment deleted' },
  attachment_added: { icon: '📎', message: (p) => `Attachment added: ${p.filename}` },
  attachment_removed: { icon: '🗑️', message: (p) => `Attachment removed: ${p.filename}` },
  status_changed: { icon: '🔄', message: (p) => `Status changed from ${p.old_status} to ${p.new_status}` },
  priority_changed: { icon: '⚡', message: (p) => `Priority changed to ${p.priority}` },
  deadline_set: { icon: '⏰', message: (p) => `Deadline set to ${new Date(p.deadline).toLocaleString()}` },
  deadline_cleared: { icon: '⏰', message: () => 'Deadline cleared' },
  flag_added: { icon: '🚩', message: (p) => `Flag added: ${p.flag}` },
  flag_removed: { icon: '🚩', message: (p) => `Flag removed: ${p.flag}` },
  version_created: { icon: '📝', message: () => 'New version created' },
  mention_added: { icon: '👤', message: (p) => `Mentioned user ${p.mentioned_user_id}` },
  subtask_created: { icon: '☑️', message: (p) => `Subtask created: ${p.title}` },
  subtask_completed: { icon: '✅', message: (p) => `Subtask completed: ${p.title}` },
  checklist_item_added: { icon: '📋', message: (p) => `Checklist item added: ${p.text}` },
  checklist_item_completed: { icon: '✅', message: (p) => `Checklist item completed: ${p.text}` },
  ownership_transferred: { icon: '🔑', message: (p) => `Ownership transferred from ${p.from_user_id} to ${p.to_user_id}` },
  sla_breached: { icon: '🚨', message: () => 'SLA breached!' },
  sla_resolved: { icon: '✅', message: () => 'SLA resolved' },
  expiration_set: { icon: '⏰', message: (p) => `Expiration set to ${new Date(p.expires_at).toLocaleString()}` },
  expiration_triggered: { icon: '💀', message: () => 'Request expired' },
  webhook_triggered: { icon: '🔔', message: (p) => `Webhook triggered: ${p.event}` },
  group_added: { icon: '📁', message: (p) => `Added to group: ${p.group_name}` },
  group_removed: { icon: '📁', message: (p) => `Removed from group: ${p.group_name}` },
  tag_added: { icon: '🏷️', message: (p) => `Tag added: ${p.tag}` },
  tag_removed: { icon: '🏷️', message: (p) => `Tag removed: ${p.tag}` },
  template_applied: { icon: '📄', message: (p) => `Template applied: ${p.template_name}` },
  webhook_test_sent: { icon: '🧪', message: (p) => `Webhook test sent to ${p.url} (${p.method}, ${p.status_code})` },
  webhook_replayed: { icon: '🔄', message: (p) => `Webhook replayed: ${p.webhook_id} (${p.status_code})` },
  tenant_created: { icon: '🏢', message: (p) => `Tenant created: ${p.name}` }
}

export default async function ActivityPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const { data: activities, error } = await supabase
    .from('api_request_activity')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load activities:', error)
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Activity Feed</h1>

      <div className='space-y-6'>
        {activities?.map((a: any) => {
          const config = activityConfig[a.type] || { icon: '📌', message: () => a.type }
          return (
            <div key={a.id} className='border p-4 rounded bg-gray-50 flex items-start gap-4'>
              <div className='text-2xl'>{config.icon}</div>
              <div className='flex-1'>
                <p className='font-bold'>{config.message(a.payload)}</p>
                <p className='text-xs text-gray-500 mt-1'>
                  {new Date(a.created_at).toLocaleString()} by {a.actor_id}
                </p>
              </div>
            </div>
          )
        })}

        {(!activities || activities.length === 0) && (
          <p className='text-gray-500'>No activity yet.</p>
        )}
      </div>
    </div>
  )
}
