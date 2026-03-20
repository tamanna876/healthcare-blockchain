import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getAppointments, updateAppointmentStatus } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function DoctorCenter() {
  const { role } = useAuth()
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    async function loadAppointments() {
      setAppointments(await getAppointments())
    }

    loadAppointments()
  }, [])

  if (role !== 'Doctor') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Doctor Center is only available to users with the Doctor role.
        </p>
      </div>
    )
  }

  const handleStatusChange = async (id, status) => {
    await updateAppointmentStatus(id, status)
    setAppointments(await getAppointments())
    toast.success(`Appointment marked ${status.toLowerCase()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Center"
        subtitle="Manage incoming appointment requests and patient scheduling."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Doctor Center' }]}
      />

      <Card title="Appointment requests" description="Review and confirm patient appointments.">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointment requests yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-slate-900">{appt.patientEmail}</p>
                  <p className="text-sm text-slate-600">
                    {appt.date} at {appt.time}
                  </p>
                  <p className="text-xs text-slate-500">Status: {appt.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Cancel
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
