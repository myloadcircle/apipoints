'use client'

import { useState, useEffect } from 'react'
import NotificationItem from '@/components/NotificationItem'

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s

    return () => clearInterval(interval)
  }, [])

  async function markAsRead(id: string) {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', notificationId: id })
    })

    if (res.ok) {
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    }
  }

  async function markAllAsRead() {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' })
    })

    if (res.ok) {
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className='relative p-2'
      >
        <span className='text-2xl'>🔔</span>
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className='absolute right-0 top-10 w-80 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50'>
          <div className='p-3 border-b flex justify-between items-center'>
            <h3 className='font-bold'>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className='text-xs text-blue-600 underline'
              >
                Mark all read
              </button>
            )}
          </div>

          <div>
            {notifications.length === 0 ? (
              <p className='p-4 text-gray-500 text-sm'>No notifications</p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  type={n.type}
                  payload={n.payload}
                  read={n.read}
                  created_at={n.created_at}
                  onMarkRead={markAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
