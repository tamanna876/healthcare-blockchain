import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { addMedicalRecord, getMedicalRecords } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Spinner from '../components/ui/Spinner.jsx'

export default function MedicalRecords() {
  const { role, hasRole } = useAuth()
  const [patientAddress, setPatientAddress] = useState('')
  const [recordId, setRecordId] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleAdd = async (event) => {
    event.preventDefault()
    setNotice(null)
    setLoading(true)

    try {
      await addMedicalRecord(patientAddress, recordId)
      toast.success('Record added successfully')
      setRecordId('')
      await handleFetch(event, true)
    } catch (error) {
      toast.error(error.message)
      setNotice({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = async (event, skipEventPrevent) => {
    if (!skipEventPrevent) event.preventDefault()
    setNotice(null)
    setLoading(true)

    try {
      const data = await getMedicalRecords(patientAddress)
      setRecords(Array.isArray(data) ? data : [])
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setNotice({ type: 'info', message: 'No records found for that patient address.' })
        toast('No records found for that patient address.', { icon: 'ℹ️' })
      }
    } catch (error) {
      setRecords([])
      toast.error(error.message)
      setNotice({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!hasRole(['Doctor', 'Hospital', 'Admin'])) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white/70 p-10 shadow-sm shadow-slate-200/50">
        <h1 className="text-xl font-semibold text-slate-900">Access restricted</h1>
        <p className="max-w-md text-center text-sm text-slate-600">
          Only Doctors, Hospitals, and Admins can manage medical records. Please sign in with a permitted role.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Records"
        subtitle="Add and search patient records securely on the blockchain."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Medical Records' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Add Medical Record" description="Link a new record ID to a patient address.">
          <form className="space-y-4" onSubmit={handleAdd}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Patient address</span>
              <input
                value={patientAddress}
                onChange={(event) => setPatientAddress(event.target.value)}
                required
                placeholder="0x1234..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">IPFS hash (record ID)</span>
              <input
                value={recordId}
                onChange={(event) => setRecordId(event.target.value)}
                required
                placeholder="Qm..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit record'}
            </button>
          </form>
        </Card>

        <Card title="View Patient Records" description="Search for existing records by patient address.">
          <form className="space-y-4" onSubmit={handleFetch}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Patient address</span>
              <input
                value={patientAddress}
                onChange={(event) => setPatientAddress(event.target.value)}
                required
                placeholder="0x1234..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={18} /> Loading…
                </span>
              ) : (
                'Lookup records'
              )}
            </button>
          </form>

          {notice ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                notice.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : notice.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {notice.message}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">IPFS Hash</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                      No records to display.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={`${record.ipfsHash ?? record.id}-${record.timestamp ?? record.createdAt}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {record.ipfsHash ?? record.id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.doctor || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(record.timestamp ?? record.createdAt ?? undefined).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
