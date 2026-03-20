import { useMemo, useRef, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { toast } from 'react-hot-toast'
import {
  UserGroupIcon,
  UserPlusIcon,
  ShareIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

const permissionCatalog = [
  { id: 'view-records', label: 'View Medical Records', icon: ClipboardDocumentListIcon },
  { id: 'view-labs', label: 'View Lab Reports', icon: EyeIcon },
  { id: 'emergency-alerts', label: 'Receive Emergency Alerts', icon: BellIcon },
]

const initialMembers = [
  {
    id: 1,
    name: 'Aarav Mehta',
    relation: 'Father',
    email: 'aarav.m@example.com',
    phone: '+91 90000 11001',
    status: 'active',
    lastAccessAt: '2026-03-10T09:30:00.000Z',
    permissions: ['view-records', 'emergency-alerts'],
  },
  {
    id: 2,
    name: 'Anaya Mehta',
    relation: 'Sister',
    email: 'anaya.m@example.com',
    phone: '+91 90000 11002',
    status: 'active',
    lastAccessAt: '2026-03-13T18:45:00.000Z',
    permissions: ['view-records', 'view-labs'],
  },
]

const initialRequests = [
  {
    id: 101,
    requesterName: 'Ritika Mehta',
    relation: 'Mother',
    email: 'ritika.m@example.com',
    requestedAt: '2026-03-14T12:00:00.000Z',
    requestedPermissions: ['view-records', 'emergency-alerts'],
  },
]

export default function FamilyAccess() {
  const auth = useAuth()
  const [members, setMembers] = useState(initialMembers)
  const [requests, setRequests] = useState(initialRequests)
  const [inviteForm, setInviteForm] = useState({ name: '', relation: '', email: '', phone: '' })
  const nextMemberId = useRef(200)

  const getNextMemberId = () => {
    const id = nextMemberId.current
    nextMemberId.current += 1
    return id
  }

  const stats = useMemo(() => {
    const active = members.filter((member) => member.status === 'active').length
    const emergencyEnabled = members.filter((member) => member.permissions.includes('emergency-alerts')).length

    return {
      active,
      pending: requests.length,
      emergencyEnabled,
    }
  }, [members, requests])

  const onInviteSubmit = (event) => {
    event.preventDefault()

    if (!inviteForm.name || !inviteForm.relation || !inviteForm.email) {
      toast.error('Name, relation, and email are required')
      return
    }

    const newMember = {
      id: getNextMemberId(),
      name: inviteForm.name.trim(),
      relation: inviteForm.relation.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      phone: inviteForm.phone.trim() || 'Not provided',
      status: 'active',
      lastAccessAt: new Date().toISOString(),
      permissions: ['view-records'],
    }

    setMembers((prev) => [newMember, ...prev])
    setInviteForm({ name: '', relation: '', email: '', phone: '' })
    toast.success('Family member access was added successfully')
  }

  const togglePermission = (memberId, permissionId) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== memberId) {
          return member
        }

        const hasPermission = member.permissions.includes(permissionId)

        return {
          ...member,
          permissions: hasPermission
            ? member.permissions.filter((item) => item !== permissionId)
            : [...member.permissions, permissionId],
        }
      }),
    )

    toast.success('Access permissions were updated')
  }

  const removeMember = (memberId) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId))
    toast.success('Member access was revoked')
  }

  const approveRequest = (requestId) => {
    const request = requests.find((item) => item.id === requestId)
    if (!request) return

    const newMember = {
      id: getNextMemberId(),
      name: request.requesterName,
      relation: request.relation,
      email: request.email,
      phone: 'Not provided',
      status: 'active',
      lastAccessAt: new Date().toISOString(),
      permissions: request.requestedPermissions,
    }

    setMembers((prev) => [newMember, ...prev])
    setRequests((prev) => prev.filter((item) => item.id !== requestId))
    toast.success('Access request approved')
  }

  const rejectRequest = (requestId) => {
    setRequests((prev) => prev.filter((item) => item.id !== requestId))
    toast.success('Access request rejected')
  }

  const sendEmergencyAlert = () => {
    toast.success('Emergency alert sent to all authorized family members')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Family Access</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Give trusted family members controlled access and keep emergency coordination fast.
          </p>
        </div>
        <button
          onClick={sendEmergencyAlert}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <BellIcon className="h-4 w-4" />
          Send Emergency Alert
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-8 w-8 text-brand-600" />
            <div>
              <p className="text-sm text-slate-500">Active Family Members</p>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm text-slate-500">Emergency Enabled</p>
              <p className="text-2xl font-bold text-slate-900">{stats.emergencyEnabled}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm text-slate-500">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Invite Family Member" description="Share relationship-based access with custom permissions.">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onInviteSubmit}>
          <input
            value={inviteForm.name}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Full Name"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={inviteForm.relation}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, relation: event.target.value }))}
            placeholder="Relation (Mother, Brother, etc.)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={inviteForm.email}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email Address"
            type="email"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={inviteForm.phone}
            onChange={(event) => setInviteForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Phone Number (optional)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Family Access
            </button>
          </div>
        </form>
      </Card>

      <Card title="Current Access Members">
        <div className="space-y-4">
          {members.length === 0 && <p className="text-sm text-slate-500">No members have been added yet.</p>}
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-600">{member.relation}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><EnvelopeIcon className="h-4 w-4" /> {member.email}</span>
                    <span className="inline-flex items-center gap-1"><PhoneIcon className="h-4 w-4" /> {member.phone}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Last access: {new Date(member.lastAccessAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  Revoke Access
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {permissionCatalog.map((permission) => {
                  const enabled = member.permissions.includes(permission.id)
                  const PermissionIcon = permission.icon

                  return (
                    <button
                      key={`${member.id}-${permission.id}`}
                      onClick={() => togglePermission(member.id, permission.id)}
                      className={`inline-flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                        enabled
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <PermissionIcon className="h-4 w-4" />
                        {permission.label}
                      </span>
                      {enabled ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Pending Access Requests">
        <div className="space-y-3">
          {requests.length === 0 && <p className="text-sm text-slate-500">No pending requests.</p>}
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{request.requesterName}</p>
                  <p className="text-sm text-slate-600">{request.relation} • {request.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {request.requestedPermissions.map((permissionId) => {
                      const matched = permissionCatalog.find((item) => item.id === permissionId)

                      return (
                        <span
                          key={`${request.id}-${permissionId}`}
                          className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {matched ? matched.label : permissionId}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveRequest(request.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(request.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <ShareIcon className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">Account Owner</p>
            <p>Access controls are active for {auth.displayName || auth.email}. Review sensitive permissions regularly.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}