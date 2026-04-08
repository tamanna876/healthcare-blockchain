import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getClinicalTrials, saveClinicalTrial } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const DEMO_TRIALS = [
  {
    id: 'trial-demo-1',
    trialName: 'Phase 2 Vaccine Safety Review',
    researcher: 'Dr. Elena Morris',
    createdAt: '2026-03-18T09:30:00.000Z',
  },
  {
    id: 'trial-demo-2',
    trialName: 'Cardiac Monitoring Device Pilot',
    researcher: 'Dr. Arjun Patel',
    createdAt: '2026-02-26T14:15:00.000Z',
  },
]

export default function ClinicalTrials() {
  const { role } = useAuth()
  const [trialName, setTrialName] = useState('')
  const [researcher, setResearcher] = useState('')
  const [resultData, setResultData] = useState('')
  const [trials, setTrials] = useState([])
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)

  const allowedRoles = ['Doctor', 'Admin', 'Hospital']

  useEffect(() => {
    async function loadTrials() {
      try {
        const data = await getClinicalTrials()
        setTrials(Array.isArray(data) && data.length > 0 ? data : DEMO_TRIALS)
        if (!Array.isArray(data) || data.length === 0) {
          toast('Demo clinical trial data loaded', { icon: 'ℹ️' })
        }
      } catch {
        setTrials(DEMO_TRIALS)
        toast('Demo clinical trial data loaded', { icon: 'ℹ️' })
      } finally {
        setLoading(false)
      }
    }

    loadTrials()
  }, [])

  if (!allowedRoles.includes(role)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Clinical Trials module is only available to Doctor, Hospital, and Admin users.
        </p>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!trialName.trim() || !researcher.trim() || !resultData.trim()) {
      const message = 'All fields are required.'
      setNotice({ type: 'error', message })
      toast.error(message)
      return
    }

    const record = await saveClinicalTrial({
      trialName,
      trialId: `TRIAL-${Date.now()}`,
      researcher,
      institution: 'Healthcare Trust Research Unit',
      phase: 'Phase 1',
      description: resultData,
      eligibilityCriteria: 'To be defined',
    })
    setTrials((previous) => [record, ...previous])
    const message = 'Clinical trial record saved.'
    setNotice({ type: 'success', message })
    toast.success(message)
    setTrialName('')
    setResearcher('')
    setResultData('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Trials"
        subtitle="Upload and browse clinical trial data in a secure, auditable registry."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clinical Trials' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Upload trial data"
          description="Save trial reports and results for future auditing and verification."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Trial name</span>
              <input
                value={trialName}
                onChange={(event) => setTrialName(event.target.value)}
                required
                placeholder="Phase 2 - Vaccine Efficacy"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Researcher</span>
              <input
                value={researcher}
                onChange={(event) => setResearcher(event.target.value)}
                required
                placeholder="Dr. Gonzalez"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Result data</span>
              <textarea
                value={resultData}
                onChange={(event) => setResultData(event.target.value)}
                rows={4}
                placeholder="Brief results or key findings..."
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            {notice ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  notice.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {notice.message}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Save trial record
            </button>
          </form>
        </Card>

        <Card title="Trial records" description="Review previously submitted trial records.">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Trial name</th>
                  <th className="px-4 py-3">Researcher</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                      Loading trials...
                    </td>
                  </tr>
                ) : trials.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                      No trial data has been uploaded yet.
                    </td>
                  </tr>
                ) : (
                  trials.map((trial) => (
                    <tr key={trial.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{trial.trialName}</td>
                      <td className="px-4 py-3 text-slate-600">{trial.researcher}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(trial.createdAt || Date.now()).toLocaleString()}
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
