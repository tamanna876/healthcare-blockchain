import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function Profile() {
  const { role, email, loginAt, healthId, displayName, phone, updateProfile } = useAuth()
  const [name, setName] = useState(displayName || '')
  const [phoneNumber, setPhoneNumber] = useState(phone || '')

  const handleSaveProfile = (event) => {
    event.preventDefault()
    updateProfile({ displayName: name, phone: phoneNumber })
    toast.success('Profile updated')
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
    </div>
  )
}
