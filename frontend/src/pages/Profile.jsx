import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getActiveSessions, revokeSession } from '../services/api.js'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function Profile() {
  const { role, email, loginAt, healthId, displayName, phone, updateProfile, logoutAllDevices } = useAuth()
  const [name, setName] = useState(displayName || '')
  const [phoneNumber, setPhoneNumber] = useState(phone || '')
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState(null)

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getActiveSessions()
        setSessions(data?.sessions || [])
      } catch {
        setSessions([])
      } finally {
        setSessionsLoading(false)
      }
    }

    loadSessions()
  }, [])

  const handleSaveProfile = (event) => {
    event.preventDefault()
    updateProfile({ displayName: name, phone: phoneNumber })
    toast.success('Profile updated')
  }

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true)
    try {
      await logoutAllDevices()
      toast.success('Logged out from all devices')
    } catch (error) {
      toast.error(error.message || 'Unable to logout from all devices')
      setLoggingOutAll(false)
    }
  }

  const handleRevokeSession = async (sessionId, isCurrentDevice) => {
    setRevokingSessionId(sessionId)
    try {
      await revokeSession(sessionId)
      setSessions((prev) => prev.filter((session) => session._id !== sessionId))
      toast.success('Session revoked')
      if (isCurrentDevice) {
        await logoutAllDevices()
      }
    } catch (error) {
      toast.error(error.message || 'Unable to revoke session')
      setRevokingSessionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="View and update your personal profile details."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      <Card title="User details" description="Your authenticated session information.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{role || 'Guest'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{email || 'Not signed in'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Health ID</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{healthId || '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member since</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loginAt ? new Date(loginAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="(555) 123-4567"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <button
            type="submit"
            className="h-fit rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
          >
            Save changes
          </button>
        </form>
      </Card>

      <Card title="Admin panel" description="Access system-wide management tools." footer="Available only for users with the Admin role.">
        <p className="text-sm text-slate-600">
          If you are an <span className="font-semibold">Admin</span>, you can access the system monitoring and user management tools from the Admin panel.
        </p>
      </Card>

      <Card
        title="Active sessions"
        description="Review signed-in devices and end all sessions if suspicious activity is detected."
      >
        {sessionsLoading ? (
          <p className="text-sm text-slate-500">Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No active session records found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{session.deviceName || 'Unknown device'}</p>
                  {session.isCurrentDevice ? (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Current device
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">IP: {session.ipAddress || 'unknown'}</p>
                <p className="mt-1 text-xs text-slate-500">Last seen: {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : '—'}</p>
                <button
                  type="button"
                  disabled={revokingSessionId === session._id}
                  onClick={() => handleRevokeSession(session._id, Boolean(session.isCurrentDevice))}
                  className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {revokingSessionId === session._id ? 'Revoking...' : 'Logout this device'}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={loggingOutAll}
          onClick={handleLogoutAllDevices}
          className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOutAll ? 'Signing out all devices...' : 'Logout from all devices'}
        </button>
      </Card>
    </div>
  )
}
