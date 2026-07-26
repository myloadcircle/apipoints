import { NotificationType } from '@/server/create-notification'

interface NotificationItemProps {
  id: string
  type: string
  payload: any
  read: boolean
  created_at: string
  onMarkRead: (id: string) => void
}

const notificationConfig: Record<string, { icon: string; message: (p: any) => string }> = {
  comment_created: { icon: '💬', message: (p) => `New comment: "${p.message?.slice(0, 30)}..."` },
  mention_added: { icon: '👤', message: (p) => `You were mentioned in a request` },
  attachment_added: { icon: '📎', message: (p) => `Attachment added: ${p.filename}` },
  status_changed: { icon: '🔄', message: (p) => `Status changed from ${p.old_status} to ${p.new_status}` },
  priority_changed: { icon: '⚡', message: (p) => `Priority changed to ${p.priority}` },
  deadline_set: { icon: '⏰', message: (p) => `Deadline set` },
  deadline_cleared: { icon: '⏰', message: () => 'Deadline cleared' },
  flag_added: { icon: '🚩', message: (p) => `Flag added: ${p.flag}` },
  flag_removed: { icon: '🚩', message: (p) => `Flag removed: ${p.flag}` },
  version_created: { icon: '📝', message: () => 'New version created' },
  subtask_assigned: { icon: '☑️', message: (p) => `Subtask assigned: ${p.title}` },
  subtask_completed: { icon: '✅', message: (p) => `Subtask completed: ${p.title}` },
  checklist_item_assigned: { icon: '📋', message: (p) => `Checklist item: ${p.text}` },
  checklist_item_completed: { icon: '✅', message: (p) => `Checklist item completed: ${p.text}` },
  ownership_transferred: { icon: '🔑', message: (p) => `Ownership transferred` },
  sla_breached: { icon: '🚨', message: () => 'SLA breached!' },
  expiration_triggered: { icon: '💀', message: () => 'Request expired' },
  webhook_failed: { icon: '🔔', message: (p) => `Webhook failed: ${p.event}` },
  webhook_succeeded: { icon: '🔔', message: (p) => `Webhook succeeded: ${p.event}` }
}

export default function NotificationItem({ id, type, payload, read, created_at, onMarkRead }: NotificationItemProps) {
  const config = notificationConfig[type] || { icon: '📌', message: () => type }

  return (
    <div className={`p-3 border-b flex items-start gap-3 ${read ? 'opacity-60' : 'bg-blue-50'}`}>
      <div className='text-xl'>{config.icon}</div>
      <div className='flex-1'>
        <p className='text-sm'>{config.message(payload)}</p>
        <p className='text-xs text-gray-500 mt-1'>
          {new Date(created_at).toLocaleString()}
        </p>
      </div>
      {!read && (
        <button
          onClick={() => onMarkRead(id)}
          className='text-xs text-blue-600 underline'
        >
          Mark read
        </button>
      )}
    </div>
  )
}
