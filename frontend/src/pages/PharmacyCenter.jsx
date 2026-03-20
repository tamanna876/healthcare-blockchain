import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getPrescriptions, updatePrescriptionStatus } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function PharmacyCenter() {
  const { role } = useAuth()
  const [requests, setRequests] = useState([])

  useEffect(() => {
    async function loadRequests() {
      setRequests(await getPrescriptions())
    }

    loadRequests()
  }, [])

  if (role !== 'Pharmacy') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Pharmacy Center is only available to users with the Pharmacy role.
        </p>
      </div>
    )
  }

  const handleStatusChange = async (id, status) => {
    await updatePrescriptionStatus(id, status)
    setRequests(await getPrescriptions())
    toast.success(`Prescription marked ${status.toLowerCase()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Center"
        subtitle="Manage refill requests and fulfill prescriptions."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pharmacy Center' }]}
      />

      <Card title="Refill requests" description="Review and fulfill prescription refill requests.">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No refill requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-slate-900">{req.patientEmail}</p>
                  <p className="text-sm text-slate-600">{req.medication} • {req.dosage}</p>
                  <p className="text-xs text-slate-500">Pharmacy: {req.pharmacy}</p>
                  <p className="text-xs text-slate-500">Status: {req.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(req.id, 'Fulfilled')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark filled
                  </button>
                  <button
                    onClick={() => handleStatusChange(req.id, 'Cancelled')}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
