import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  createVaultShareLink,
  evaluateSmartAccess,
  getClinicalTimeline,
  getComplianceKpis,
  getOfflineStatus,
  queueOfflineAction,
  syncOfflineActions,
  runAdvancedSearch,
  saveAdvancedFilterView,
  getAdvancedFilterViews,
  getTrustRecords,
  getEmergencyFacilities,
} from '../services/api.js'

export default function InnovationHub() {
  const [patientAddress, setPatientAddress] = useState('')
  const [context, setContext] = useState('normal')
  const [breakGlassReason, setBreakGlassReason] = useState('')
  const [accessResult, setAccessResult] = useState(null)
  const [shareResult, setShareResult] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [compliance, setCompliance] = useState(null)
  const [offlineStatus, setOfflineStatus] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchData, setSearchData] = useState(null)
  const [savedViews, setSavedViews] = useState([])
  const [trustData, setTrustData] = useState(null)
  const [facilities, setFacilities] = useState([])

  const timelinePreview = useMemo(() => timeline.slice(0, 8), [timeline])

  const handleEvaluate = async () => {
    try {
      const data = await evaluateSmartAccess({
        patientAddress,
        context,
        breakGlassReason: context === 'emergency' ? breakGlassReason : undefined,
      })
      setAccessResult(data)
      toast.success(data.allowed ? 'Access granted' : 'Access denied')
    } catch (error) {
      toast.error(error.message || 'Unable to evaluate access')
    }
  }

  const handleCreateShareLink = async () => {
    try {
      const data = await createVaultShareLink({
        patientAddress,
        oneTime: true,
        hours: 24,
        allowDownload: false,
        watermarkText: 'Confidential - Authorized viewer only',
      })
      setShareResult(data?.link || null)
      toast.success('Secure share link generated')
    } catch (error) {
      toast.error(error.message || 'Unable to create share link')
    }
  }

  const handleTimeline = async () => {
    try {
      const data = await getClinicalTimeline(patientAddress)
      setTimeline(Array.isArray(data?.timeline) ? data.timeline : [])
    } catch (error) {
      toast.error(error.message || 'Unable to load timeline')
    }
  }

  const handleCompliance = async () => {
    try {
      const data = await getComplianceKpis()
      setCompliance(data)
    } catch (error) {
      toast.error(error.message || 'Unable to load compliance KPIs')
    }
  }

  const handleOfflineStatus = async () => {
    try {
      const data = await getOfflineStatus()
      setOfflineStatus(data)
    } catch (error) {
      toast.error(error.message || 'Unable to load offline status')
    }
  }

  const handleOfflineQueue = async () => {
    try {
      await queueOfflineAction('record-view', { patientAddress, ts: Date.now() })
      toast.success('Offline action queued')
      handleOfflineStatus()
    } catch (error) {
      toast.error(error.message || 'Unable to queue action')
    }
  }

  const handleOfflineSync = async () => {
    try {
      const data = await syncOfflineActions()
      toast.success(`Synced ${data?.synced || 0} actions`)
      handleOfflineStatus()
    } catch (error) {
      toast.error(error.message || 'Unable to sync actions')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const data = await runAdvancedSearch(searchQuery)
      setSearchData(data)
    } catch (error) {
      toast.error(error.message || 'Search failed')
    }
  }

  const handleSaveFilter = async () => {
    if (!searchQuery.trim()) return
    try {
      await saveAdvancedFilterView({
        name: `Saved: ${searchQuery}`,
        domain: 'records',
        filters: { q: searchQuery },
      })
      toast.success('Filter view saved')
      const views = await getAdvancedFilterViews()
      setSavedViews(Array.isArray(views?.views) ? views.views : [])
    } catch (error) {
      toast.error(error.message || 'Unable to save filter view')
    }
  }

  const handleTrustRecords = async () => {
    try {
      const data = await getTrustRecords(patientAddress, context)
      setTrustData(data)
    } catch (error) {
      toast.error(error.message || 'Unable to load trust details')
    }
  }

  const handleEmergencyFacilities = async () => {
    try {
      const data = await getEmergencyFacilities()
      setFacilities(Array.isArray(data?.facilities) ? data.facilities : [])
    } catch (error) {
      toast.error(error.message || 'Unable to fetch emergency facilities')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Innovation Hub</h2>
        <p className="text-sm text-slate-600">Smart access, secure sharing, real-time trust, compliance, and offline resilience.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={patientAddress}
            onChange={(event) => setPatientAddress(event.target.value)}
            placeholder="Patient wallet address"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={context}
            onChange={(event) => setContext(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="normal">Normal context</option>
            <option value="emergency">Emergency context</option>
          </select>
          <input
            value={breakGlassReason}
            onChange={(event) => setBreakGlassReason(event.target.value)}
            placeholder="Break-glass reason (emergency)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={handleEvaluate} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Evaluate Access</button>
          <button type="button" onClick={handleCreateShareLink} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Create Share Link</button>
          <button type="button" onClick={handleTimeline} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Load Timeline</button>
          <button type="button" onClick={handleTrustRecords} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Trust View</button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Access + Sharing</h3>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(accessResult, null, 2)}</pre>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(shareResult, null, 2)}</pre>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Clinical Timeline</h3>
            <span className="text-xs text-slate-500">{timeline.length} events</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {timelinePreview.map((event, idx) => (
              <li key={`${event.type}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-800">{event.type}</p>
                <p className="text-slate-600">{event.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Compliance</h3>
          <button type="button" onClick={handleCompliance} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm">Refresh</button>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(compliance, null, 2)}</pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Offline Mode</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={handleOfflineStatus} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Status</button>
            <button type="button" onClick={handleOfflineQueue} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Queue</button>
            <button type="button" onClick={handleOfflineSync} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Sync</button>
          </div>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(offlineStatus, null, 2)}</pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Emergency Facilities</h3>
          <button type="button" onClick={handleEmergencyFacilities} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm">Load Nearby</button>
          <ul className="mt-3 space-y-2 text-sm">
            {facilities.map((item) => (
              <li key={item.name} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-slate-600">ETA {item.etaMin} min</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Advanced Search + Saved Filters</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search records, prescriptions, audits"
            className="w-full max-w-lg rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={handleSearch} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
          <button type="button" onClick={handleSaveFilter} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Save filter</button>
        </div>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(searchData, null, 2)}</pre>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(savedViews, null, 2)}</pre>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Trust UX</h3>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(trustData, null, 2)}</pre>
      </section>
    </div>
  )
}
