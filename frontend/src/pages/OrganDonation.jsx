import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  getOrganDonors,
  saveOrganDonor,
} from '../services/api.js'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import TransactionStatusCard from '../components/tx/TransactionStatusCard.jsx'
import { useTrackedTransaction } from '../hooks/useTrackedTransaction.js'

const ORGANS = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea', 'Bone Marrow']

export default function OrganDonation() {
  const [name, setName] = useState('')
  const [organType, setOrganType] = useState('Kidney')
  const [location, setLocation] = useState('')
  const [donors, setDonors] = useState([])
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { transaction, executeTransaction, markTransactionFailed } = useTrackedTransaction()

  useEffect(() => {
    async function loadDonors() {
      try {
        setDonors(await getOrganDonors())
      } finally {
        setLoading(false)
      }
    }

    loadDonors()
  }, [])

  const handleRegister = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setNotice(null)

    try {
      const payload = { name, organType, bloodGroup: 'O+', location }
      const record = await executeTransaction({
        txType: 'organ-donor-register',
        payload,
        submit: saveOrganDonor,
        getTxHash: (response) => response?.txHash || response?.transactionHash || null,
      })
      setDonors((previous) => [record, ...previous])
      setNotice({ type: 'success', message: 'Organ donor registered successfully.' })
      toast.success('Organ donor registered successfully')

      setName('')
      setLocation('')
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to register organ donor.' })
      toast.error(error.message || 'Failed to register organ donor.')
      markTransactionFailed(error.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = async () => {
    if (!transaction?.payload) return
    setName(transaction.payload.name)
    setOrganType(transaction.payload.organType)
    setLocation(transaction.payload.location)
    await handleRegister({ preventDefault() {} })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organ Donation"
        subtitle="Register organ donors and browse available matches."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Organ Donation' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Register Donor" description="Add a donor and their available organ to the registry.">
          <form className="space-y-4" onSubmit={handleRegister}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Alex Johnson"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Organ type</span>
              <select
                value={organType}
                onChange={(event) => setOrganType(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              >
                {ORGANS.map((organ) => (
                  <option key={organ} value={organ}>
                    {organ}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="City, State"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            {notice ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice.message}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              {submitting ? 'Registering...' : 'Register donor'}
            </button>
          </form>
        </Card>

        <Card title="Available donors" description="Browse currently registered organ donors.">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Organ</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                      Loading donors...
                    </td>
                  </tr>
                ) : donors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                      No donors registered yet.
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => (
                    <tr key={donor.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{donor.name}</td>
                      <td className="px-4 py-3 text-slate-600">{donor.organType}</td>
                      <td className="px-4 py-3 text-slate-600">{donor.location}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(donor.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <TransactionStatusCard transaction={transaction} onRetry={handleRetry} />
    </div>
  )
}
