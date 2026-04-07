import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  createConsentGrant,
  extendConsentGrant,
  getConsentGrants,
  revokeConsentGrant,
} from '../services/api.js'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const permissionOptions = [
  { id: 'view-records', label: 'View medical records' },
  { id: 'view-labs', label: 'View lab reports' },
  { id: 'emergency-alerts', label: 'Emergency alerts' },
]

const durationOptions = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: '30d', label: '30 days', hours: 24 * 30 },
]

function addHoursToIso(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function toStatus(grant) {
  if (grant.status === 'revoked') return 'revoked'
  if (new Date(grant.expiresAt).getTime() < Date.now()) return 'expired'
  return 'active'
}

export default function FamilyAccess() {
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState([])
  const [grantType, setGrantType] = useState('family')
  const [granteeName, setGranteeName] = useState('')
  const [granteeIdentifier, setGranteeIdentifier] = useState('')
  const [duration, setDuration] = useState('7d')
  const [selectedPermissions, setSelectedPermissions] = useState(['view-records'])

  const stats = useMemo(() => {
    const active = consents.filter((item) => toStatus(item) === 'active').length
    const revoked = consents.filter((item) => toStatus(item) === 'revoked').length
    const expired = consents.filter((item) => toStatus(item) === 'expired').length
    return { active, revoked, expired }
  }, [consents])

  const loadConsents = async () => {
    setLoading(true)
    try {
      const data = await getConsentGrants()
      setConsents(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error.message || 'Unable to load consent grants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConsents()
  }, [])

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((item) => item !== permissionId)
        : [...prev, permissionId],
    )
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!granteeName.trim() || !granteeIdentifier.trim()) {
      toast.error('Name and identifier are required')
      return
    }

    if (selectedPermissions.length === 0) {
      toast.error('Select at least one permission')
      return
    }

    const selectedDuration = durationOptions.find((item) => item.id === duration) || durationOptions[1]

    try {
      await createConsentGrant({
        granteeType: grantType,
        granteeName: granteeName.trim(),
        granteeIdentifier: granteeIdentifier.trim(),
        permissions: selectedPermissions,
        expiresAt: addHoursToIso(selectedDuration.hours),
      })
      toast.success('Consent grant created')
      setGranteeName('')
      setGranteeIdentifier('')
      setDuration('7d')
      setSelectedPermissions(['view-records'])
      loadConsents()
    } catch (error) {
      toast.error(error.message || 'Unable to create consent')
    }
  }

  const handleRevoke = async (id) => {
    try {
      await revokeConsentGrant(id)
      toast.success('Consent revoked')
      setConsents((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'revoked', revokedAt: new Date().toISOString() } : item)),
      )
    } catch (error) {
      toast.error(error.message || 'Unable to revoke consent')
    }
  }

  const handleExtend = async (id, hours) => {
    try {
      const updated = await extendConsentGrant(id, addHoursToIso(hours))
      setConsents((prev) => prev.map((item) => (item.id === id ? updated : item)))
      toast.success('Consent validity extended')
    } catch (error) {
      toast.error(error.message || 'Unable to extend consent')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consent Management"
        subtitle="Control who can access your health data, for how long, and revoke at any time."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Consent Management' }]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Active grants</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.active}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Revoked grants</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{stats.revoked}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Expired grants</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.expired}</p>
        </Card>
      </section>

      <Card title="Grant New Access" description="Give controlled access to doctor or family member.">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Grantee type</span>
              <select
                value={grantType}
                onChange={(event) => setGrantType(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="family">Family</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Duration</span>
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                {durationOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={granteeName}
                onChange={(event) => setGranteeName(event.target.value)}
                placeholder="Dr. Priya Sharma"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email or wallet address</span>
              <input
                value={granteeIdentifier}
                onChange={(event) => setGranteeIdentifier(event.target.value)}
                placeholder="doctor@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Permissions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {permissionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => togglePermission(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selectedPermissions.includes(option.id)
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Grant consent
          </button>
        </form>
      </Card>

      <Card title="Consent Timeline" description="Readable audit trail with revoke and extend actions.">
        <div className="space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading consent history...</p> : null}
          {!loading && consents.length === 0 ? (
            <p className="text-sm text-slate-500">No consent grants created yet.</p>
          ) : null}

          {consents.map((item) => {
            const status = toStatus(item)
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.granteeName} ({item.granteeType})
                    </p>
                    <p className="text-xs text-slate-500">{item.granteeIdentifier}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Granted: {new Date(item.grantedAt || item.createdAt).toLocaleString()} | Expires: {new Date(item.expiresAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">Permissions: {(item.permissions || []).join(', ')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : status === 'revoked'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {status}
                    </span>
                    {status !== 'revoked' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleExtend(item.id, 24 * 7)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(item.id)}
                          className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Revoke
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
