import { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  addMedicineToInventory,
  verifyMedicine,
} from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import TransactionStatusCard from '../components/tx/TransactionStatusCard.jsx'
import { useTrackedTransaction } from '../hooks/useTrackedTransaction.js'

export default function MedicineVerification() {
  const [medicineId, setMedicineId] = useState('')
  const [name, setName] = useState('')
  const [batch, setBatch] = useState('')
  const { role } = useAuth()
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const { transaction, executeTransaction, markTransactionFailed } = useTrackedTransaction()


  const allowedRoles = ['Pharmacy', 'Doctor', 'Hospital', 'Admin']
  if (!allowedRoles.includes(role)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Medicine Verification module is only available to Pharmacy, Doctor, Hospital, and Admin users.
        </p>
      </div>
    )
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setNotice(null)
    if (!medicineId.trim()) {
      const message = 'Please enter a medicine ID to verify.'
      setNotice({ type: 'error', message })
      toast.error(message)
      return
    }
    setBusy(true)

    try {
      const response = await verifyMedicine(medicineId.trim())
      setResult(response)
      if (response.authentic) {
        toast.success('Medicine verified as authentic.')
      } else {
        toast.error('Medicine could not be verified.')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!medicineId.trim() || !name.trim() || !batch.trim()) {
      const message = 'Provide medicine id, name and batch to add to registry.'
      setNotice({ type: 'error', message })
      toast.error(message)
      return
    }
    setBusy(true)

    try {
      const payload = {
        medicineId: medicineId.trim(),
        name: name.trim(),
        manufacturer: role === 'Pharmacy' ? 'Pharmacy Center' : 'Hospital Supply',
        batchNumber: batch.trim(),
      }

      await executeTransaction({
        txType: 'medicine-register',
        payload,
        submit: addMedicineToInventory,
        getTxHash: (response) => response?.txHash || response?.transactionHash || null,
      })

      const message = 'Medicine added to registry.'
      setNotice({ type: 'success', message })
      toast.success(message)
      setMedicineId('')
      setName('')
      setBatch('')
      setResult(null)
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to add medicine to registry.' })
      toast.error(error.message || 'Failed to add medicine to registry.')
      markTransactionFailed(error.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  const handleRetry = async () => {
    if (!transaction?.payload) return
    setMedicineId(transaction.payload.medicineId)
    setName(transaction.payload.name)
    setBatch(transaction.payload.batchNumber)
    await handleAdd({ preventDefault() {} })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Verification"
        subtitle="Verify the authenticity of medicines using a decentralized registry."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Medicine Verification' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Verify medicine"
          description="Input a medicine ID to check if it is known in the system."
        >
          <form className="space-y-4" onSubmit={handleVerify}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Medicine ID</span>
              <input
                value={medicineId}
                onChange={(event) => setMedicineId(event.target.value)}
                placeholder="MED-1234"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Verify authenticity
            </button>
          </form>

          {result ? (
            <div
              className={`mt-6 rounded-xl border px-4 py-4 text-sm ${
                result.authentic
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              <p className="font-semibold">
                {result.authentic ? 'Authentic medicine' : 'Potential counterfeit'}
              </p>
              <p className="mt-2 text-sm text-slate-700">{result.message}</p>
              {result.authentic && result.details ? (
                <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-medium">Name:</span> {result.details.name}
                  </p>
                  <p>
                    <span className="font-medium">Batch:</span> {result.details.batch}
                  </p>
                  <p>
                    <span className="font-medium">Added:</span>{' '}
                    {new Date(result.details.addedAt).toLocaleString()}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {notice ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                notice.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {notice.message}
            </div>
          ) : null}
        </Card>

        <Card
          title="Add medicine to registry"
          description="Use this form to add trusted medicine batches into the registry."
        >
          <form className="space-y-4" onSubmit={handleAdd}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Medicine ID</span>
              <input
                value={medicineId}
                onChange={(event) => setMedicineId(event.target.value)}
                placeholder="MED-1234"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="PainRelief 250mg"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Batch</span>
              <input
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                placeholder="BATCH-2025-01"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Add to registry
            </button>
          </form>
        </Card>
      </div>

      <TransactionStatusCard transaction={transaction} onRetry={handleRetry} />
    </div>
  )
}
