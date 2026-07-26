import { ActivityType } from '@/server/log-activity'

interface TimelineEventProps {
  type: string
  payload: any
  created_at: string
  actor_id: string
}

const eventConfig: Record<string, { icon: string; message: (p: any) => string }> = {
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
  template_applied: { icon: '📄', message: (p) => `Template applied: ${p.template_name}` }
}

export default function TimelineEvent({ type, payload, created_at, actor_id }: TimelineEventProps) {
  const config = eventConfig[type] || { icon: '📌', message: () => type }

  return (
    <div className='flex items-start gap-4 p-4 border-l-2 border-blue-200 pl-6 relative'>
      <div className='absolute -left-3 top-4 w-6 h-6 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center text-xs'>
        {config.icon}
      </div>
      <div className='flex-1'>
        <p className='font-bold'>{config.message(payload)}</p>
        <p className='text-xs text-gray-500 mt-1'>
          {new Date(created_at).toLocaleString()} by {actor_id}
        </p>
        {payload && Object.keys(payload).length > 0 && (
          <details className='mt-2'>
            <summary className='cursor-pointer text-sm text-blue-600'>View details</summary>
            <pre className='text-xs bg-gray-50 p-3 rounded border mt-1 whitespace-pre-wrap'>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
