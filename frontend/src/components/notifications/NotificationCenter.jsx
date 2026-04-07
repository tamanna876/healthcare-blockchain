import { useEffect, useMemo, useState } from 'react'
import { BellIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  ackLiveAlert,
  escalateLiveAlert,
} from '../../services/api.js'

const CATEGORY_LABELS = {
  BLOOD_DONATION_REQUEST: 'donors',
  ORGAN_DONATION_REQUEST: 'donors',
  EMERGENCY_ALERT: 'emergency',
  CERTIFICATE_EVENT: 'certificates',
  PRESCRIPTION: 'prescriptions',
  APPOINTMENT: 'appointments',
  REMINDER: 'reminders',
  CLINICAL_TRIAL: 'trials',
}

function toCategory(type) {
  return CATEGORY_LABELS[type] || 'system'
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [stickyCritical, setStickyCritical] = useState(null)

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications
    if (activeFilter === 'unread') return notifications.filter((item) => !item.read)
    return notifications.filter((item) => toCategory(item.type) === activeFilter)
  }, [activeFilter, notifications])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await getMyNotifications(false)
      const incoming = Array.isArray(data?.notifications) ? data.notifications : []
      const sorted = [...incoming].sort((left, right) => Number(right.sentAt || 0) - Number(left.sentAt || 0))
      setNotifications(sorted)
    } catch (error) {
      toast.error(error.message || 'Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const intervalId = setInterval(loadNotifications, 25000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws/alerts`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'notification' && payload.notification) {
          setNotifications((prev) => [payload.notification, ...prev].slice(0, 120))
          if (payload.priority === 'CRITICAL') {
            setStickyCritical(payload.notification)
          }
        }
      } catch {
        // Ignore malformed websocket payloads
      }
    }

    return () => ws.close()
  }, [])

  const handleRead = async (notificationId) => {
    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)))
    try {
      await markNotificationRead(notificationId)
    } catch (error) {
      toast.error(error.message || 'Unable to mark notification as read')
      loadNotifications()
    }
  }

  const handleMarkAllRead = async () => {
    const ids = notifications.filter((item) => !item.read).map((item) => item.id)
    if (ids.length === 0) return

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    try {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error(error.message || 'Unable to mark all as read')
      loadNotifications()
    }
  }

  const handleWorkflow = async (alertId, state) => {
    if (!alertId) {
      toast.error('No alert id available for workflow update')
      return
    }
    try {
      await ackLiveAlert(alertId, state)
      toast.success(`Alert marked as ${state}`)
      if (state === 'resolved') {
        setStickyCritical(null)
      }
    } catch (error) {
      toast.error(error.message || `Unable to mark ${state}`)
    }
  }

  const handleEscalate = async (alertId) => {
    if (!alertId) {
      toast.error('No alert id available for escalation')
      return
    }
    try {
      const data = await escalateLiveAlert(alertId, 'Escalated from notification center')
      toast.success(`Escalated to ${data?.escalatedTo || 'next level'}`)
    } catch (error) {
      toast.error(error.message || 'Unable to escalate alert')
    }
  }

  return (
    <div className="relative">
      {stickyCritical ? (
        <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Critical Alert</p>
              <p>{stickyCritical.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleWorkflow(stickyCritical.emergencyData?.alertId, 'accepted')}
                className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleWorkflow(stickyCritical.emergencyData?.alertId, 'resolved')}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-3 w-[22rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notification Center</p>
              <p className="text-xs text-slate-500">Unified updates across your care modules</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Mark all read
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
              <FunnelIcon className="h-3 w-3" /> Filter
            </span>
            {['all', 'unread', 'donors', 'emergency', 'certificates', 'appointments', 'prescriptions'].map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-2 py-1 text-xs font-medium ${
                  activeFilter === filter
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="max-h-96 space-y-2 overflow-auto pr-1">
            {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading notifications...</p> : null}
            {!loading && filteredNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No notifications in this filter.</p>
            ) : null}
            {filteredNotifications.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => !item.read && handleRead(item.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  item.read
                    ? 'border-slate-200 bg-white text-slate-600'
                    : 'border-brand-200 bg-brand-50/50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.title || 'Notification'}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    {toCategory(item.type)}
                  </span>
                </div>
                <p className="mt-1 text-xs">{item.message || 'No message body'}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Just now'}
                </p>
                {toCategory(item.type) === 'emergency' ? (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleWorkflow(item.emergencyData?.alertId, 'seen')
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      Seen
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleWorkflow(item.emergencyData?.alertId, 'accepted')
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEscalate(item.emergencyData?.alertId)
                      }}
                      className="rounded-md border border-red-300 px-2 py-1 text-[10px] font-semibold text-red-700"
                    >
                      Escalate
                    </button>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
