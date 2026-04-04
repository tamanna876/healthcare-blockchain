import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  deleteHealthEducationSupportProgram,
  deleteWomenHealthReminder,
  getBloodDonors,
  getClinicalTrials,
  getHealthEducationAnalytics,
  getHealthEducationSupportPrograms,
  getOrganDonors,
  getWomenHealthReminders,
  saveHealthEducationSupportProgram,
  updateHealthEducationSupportProgram,
  updateWomenHealthReminder,
} from '../services/api.js'

const CHART_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c']

const PROVIDER_DEFAULTS = {
  central: { provider: 'Central Government', badge: 'National Scheme' },
  state: { provider: 'State Government', badge: 'State Scheme' },
  who: { provider: 'World Health Organization (WHO)', badge: 'Global Guidance' },
}

const PROVIDER_LABELS = {
  central: 'Central',
  state: 'State',
  who: 'WHO',
}

const SUPPORT_FORM_DEFAULTS = {
  providerType: 'central',
  provider: 'Central Government',
  badge: 'National Scheme',
  coverage: '75',
  programName: '',
  support: '',
  link: '',
  accessSteps: '',
}

const REMINDER_FORM_DEFAULTS = {
  stage: '',
  goal: '',
  reminderType: '',
  reminderDate: '',
  notes: '',
  language: 'en',
}

function getRecordId(item) {
  return item?._id || item?.id
}

function createSupportForm(providerType = 'central') {
  const defaults = PROVIDER_DEFAULTS[providerType] || PROVIDER_DEFAULTS.central
  return { ...SUPPORT_FORM_DEFAULTS, providerType, provider: defaults.provider, badge: defaults.badge }
}

function createReminderForm() {
  return { ...REMINDER_FORM_DEFAULTS }
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString()
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export default function AdminPanel() {
  const { role } = useAuth()
  const [bloodDonors, setBloodDonors] = useState([])
  const [organDonors, setOrganDonors] = useState([])
  const [clinicalTrials, setClinicalTrials] = useState([])
  const [supportPrograms, setSupportPrograms] = useState([])
  const [womenReminders, setWomenReminders] = useState([])
  const [educationAnalytics, setEducationAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [chartRange, setChartRange] = useState('6m')
  const [editingSupportId, setEditingSupportId] = useState(null)
  const [editingReminderId, setEditingReminderId] = useState(null)
  const [supportSaving, setSupportSaving] = useState(false)
  const [reminderSavingId, setReminderSavingId] = useState(null)
  const [supportDeletingId, setSupportDeletingId] = useState(null)
  const [reminderDeletingId, setReminderDeletingId] = useState(null)
  const [supportQuery, setSupportQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [reminderQuery, setReminderQuery] = useState('')
  const [supportForm, setSupportForm] = useState(createSupportForm())
  const [reminderForm, setReminderForm] = useState(createReminderForm())

  const resetSupportForm = useCallback(() => {
    setEditingSupportId(null)
    setSupportForm(createSupportForm())
  }, [])

  const resetReminderForm = useCallback(() => {
    setEditingReminderId(null)
    setReminderForm(createReminderForm())
  }, [])

  const loadAdminData = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    setErrorMessage('')

    try {
      const [bloodData, organData, trialData, programs, reminders, analytics] = await Promise.all([
        getBloodDonors(),
        getOrganDonors(),
        getClinicalTrials(),
        getHealthEducationSupportPrograms(),
        getWomenHealthReminders(),
        getHealthEducationAnalytics(),
      ])

      setBloodDonors(bloodData)
      setOrganDonors(organData)
      setClinicalTrials(trialData)
      setSupportPrograms(programs)
      setWomenReminders(reminders)
      setEducationAnalytics(analytics)
      setLastUpdatedAt(new Date().toISOString())
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load admin data right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (role !== 'Admin') {
      setLoading(false)
      return
    }

    loadAdminData()
  }, [loadAdminData, role])

  const providerChartData = useMemo(
    () =>
      Object.entries(educationAnalytics?.providerBreakdown || {}).map(([name, value]) => ({
        name: PROVIDER_LABELS[name] || name,
        value,
      })),
    [educationAnalytics],
  )

  const stageChartData = useMemo(
    () =>
      Object.entries(educationAnalytics?.stageBreakdown || {})
        .map(([stage, count]) => ({ stage, count }))
        .sort((left, right) => right.count - left.count),
    [educationAnalytics],
  )

  const monthlyTrendChartData = useMemo(() => {
    const reminderEntries = Object.entries(educationAnalytics?.monthlyReminderCounts || {})
    const supportEntries = Object.entries(educationAnalytics?.monthlySupportCounts || {})
    const months = [...new Set([...reminderEntries.map(([month]) => month), ...supportEntries.map(([month]) => month)])]
      .sort((left, right) => left.localeCompare(right))

    const cutoff = new Date()
    if (chartRange === '3m') cutoff.setMonth(cutoff.getMonth() - 2)
    if (chartRange === '6m') cutoff.setMonth(cutoff.getMonth() - 5)
    if (chartRange === '12m') cutoff.setMonth(cutoff.getMonth() - 11)

    const reminderMap = Object.fromEntries(reminderEntries)
    const supportMap = Object.fromEntries(supportEntries)

    return months
      .filter((month) => {
        if (chartRange === 'all') return true
        return new Date(`${month}-01T00:00:00.000Z`) >= cutoff
      })
      .map((month) => ({
        month,
        reminders: Number(reminderMap[month] || 0),
        supportPrograms: Number(supportMap[month] || 0),
      }))
  }, [chartRange, educationAnalytics])

  const supportCoverageAverage = useMemo(() => {
    if (supportPrograms.length === 0) return 0
    return Math.round(
      supportPrograms.reduce((sum, program) => sum + Number(program.coverage || 0), 0) / supportPrograms.length,
    )
  }, [supportPrograms])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Blood donors',
        value: bloodDonors.length,
        helper: 'Registry intake',
        icon: HeartIcon,
        iconClass: 'bg-rose-100 text-rose-600',
      },
      {
        label: 'Organ donors',
        value: organDonors.length,
        helper: 'Transplant readiness',
        icon: ShieldCheckIcon,
        iconClass: 'bg-emerald-100 text-emerald-600',
      },
      {
        label: 'Clinical trials',
        value: clinicalTrials.length,
        helper: 'Research records',
        icon: SparklesIcon,
        iconClass: 'bg-amber-100 text-amber-600',
      },
      {
        label: 'Support programs',
        value: supportPrograms.length,
        helper: 'Education coverage',
        icon: ChartBarSquareIcon,
        iconClass: 'bg-brand-100 text-brand-700',
      },
      {
        label: 'Women reminders',
        value: womenReminders.length,
        helper: 'Scheduled care nudges',
        icon: CalendarDaysIcon,
        iconClass: 'bg-violet-100 text-violet-600',
      },
      {
        label: 'Average coverage',
        value: `${supportCoverageAverage}%`,
        helper: 'Across support schemes',
        icon: ArrowPathIcon,
        iconClass: 'bg-slate-100 text-slate-700',
      },
    ],
    [bloodDonors, clinicalTrials, organDonors, supportCoverageAverage, supportPrograms, womenReminders],
  )

  const nextReminder = useMemo(() => {
    return womenReminders
      .filter((item) => Number.isFinite(new Date(item.reminderDate).getTime()))
      .sort((left, right) => new Date(left.reminderDate) - new Date(right.reminderDate))[0] || null
  }, [womenReminders])

  const upcomingReminderCount = useMemo(() => {
    const now = Date.now()
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000

    return womenReminders.filter((item) => {
      const timestamp = new Date(item.reminderDate).getTime()
      return Number.isFinite(timestamp) && timestamp >= now && timestamp <= nextWeek
    }).length
  }, [womenReminders])

  const goalHighlights = useMemo(
    () =>
      Object.entries(educationAnalytics?.goalBreakdown || {})
        .map(([goal, count]) => ({ goal, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 3),
    [educationAnalytics],
  )

  const filteredSupportPrograms = useMemo(() => {
    const query = supportQuery.trim().toLowerCase()

    return supportPrograms.filter((program) => {
      const matchesProvider = providerFilter === 'all' || program.providerType === providerFilter
      if (!matchesProvider) return false

      if (!query) return true

      return [program.provider, program.programName, program.badge, program.support]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [providerFilter, supportPrograms, supportQuery])

  const filteredReminders = useMemo(() => {
    const query = reminderQuery.trim().toLowerCase()
    if (!query) return womenReminders

    return womenReminders.filter((reminder) =>
      [reminder.patientEmail, reminder.reminderType, reminder.stage, reminder.goal, reminder.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [reminderQuery, womenReminders])

  if (role !== 'Admin') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Admin panel is only accessible to users with the <span className="font-semibold">Admin</span> role.
          Please sign in with an Admin account to continue.
        </p>
      </div>
    )
  }

  const saveSupportProgram = async (event) => {
    event.preventDefault()

    const payload = {
      providerType: supportForm.providerType,
      provider: supportForm.provider.trim(),
      badge: supportForm.badge.trim(),
      coverage: Number(supportForm.coverage),
      programName: supportForm.programName.trim(),
      support: supportForm.support.trim(),
      link: supportForm.link.trim(),
      accessSteps: supportForm.accessSteps.split('\n').map((item) => item.trim()).filter(Boolean),
    }

    if (!payload.provider || !payload.badge || !payload.programName || !payload.support || !payload.link) {
      toast.error('Provider, badge, program name, support summary, and link are required')
      return
    }

    if (!Number.isFinite(payload.coverage) || payload.coverage < 0 || payload.coverage > 100) {
      toast.error('Coverage must be a number between 0 and 100')
      return
    }

    if (!isValidHttpUrl(payload.link)) {
      toast.error('Please enter a valid http or https link')
      return
    }

    try {
      setSupportSaving(true)

      const record = editingSupportId
        ? await updateHealthEducationSupportProgram(editingSupportId, payload)
        : await saveHealthEducationSupportProgram(payload)

      setSupportPrograms((prev) => [record, ...prev.filter((item) => getRecordId(item) !== getRecordId(record))])
      toast.success(editingSupportId ? 'Support program updated' : 'Support program created')
      resetSupportForm()
      await loadAdminData({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Unable to save the support program')
    } finally {
      setSupportSaving(false)
    }
  }

  const startEditSupportProgram = (program) => {
    setEditingSupportId(getRecordId(program))
    setSupportForm({
      providerType: program.providerType || 'central',
      provider: program.provider || '',
      badge: program.badge || '',
      coverage: String(program.coverage ?? ''),
      programName: program.programName || '',
      support: program.support || '',
      link: program.link || '',
      accessSteps: Array.isArray(program.accessSteps) ? program.accessSteps.join('\n') : '',
    })
  }

  const removeSupportProgram = async (id) => {
    if (!window.confirm('Delete this support program from the admin registry?')) return

    try {
      setSupportDeletingId(id)
      await deleteHealthEducationSupportProgram(id)
      toast.success('Support program deleted')
      if (editingSupportId === id) resetSupportForm()
      await loadAdminData({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Unable to delete the support program')
    } finally {
      setSupportDeletingId(null)
    }
  }

  const startEditReminder = (reminder) => {
    setEditingReminderId(getRecordId(reminder))
    setReminderForm({
      stage: reminder.stage || '',
      goal: reminder.goal || '',
      reminderType: reminder.reminderType || '',
      reminderDate: reminder.reminderDate ? new Date(reminder.reminderDate).toISOString().slice(0, 16) : '',
      notes: reminder.notes || '',
      language: reminder.language || 'en',
    })
  }

  const saveReminderEdit = async (id) => {
    if (!reminderForm.stage || !reminderForm.goal || !reminderForm.reminderType || !reminderForm.reminderDate) {
      toast.error('All reminder fields except notes are required')
      return
    }

    try {
      setReminderSavingId(id)
      await updateWomenHealthReminder(id, {
        language: reminderForm.language,
        stage: reminderForm.stage.trim(),
        goal: reminderForm.goal.trim(),
        reminderType: reminderForm.reminderType.trim(),
        reminderDate: new Date(reminderForm.reminderDate).toISOString(),
        notes: reminderForm.notes.trim(),
      })
      toast.success('Reminder updated')
      resetReminderForm()
      await loadAdminData({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Unable to update the reminder')
    } finally {
      setReminderSavingId(null)
    }
  }

  const removeReminder = async (id) => {
    if (!window.confirm('Delete this reminder from the schedule?')) return

    try {
      setReminderDeletingId(id)
      await deleteWomenHealthReminder(id)
      toast.success('Reminder deleted')
      if (editingReminderId === id) resetReminderForm()
      await loadAdminData({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Unable to delete the reminder')
    } finally {
      setReminderDeletingId(null)
    }
  }

  const refreshAction = (
    <button
      type="button"
      onClick={() => loadAdminData({ showLoader: false })}
      disabled={loading || refreshing}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing...' : 'Refresh data'}
    </button>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin Panel"
          subtitle="Monitor system activity, review records, and manage education operations."
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin Panel' }]}
          action={refreshAction}
        />
        <Card title="Loading admin workspace">
          <div className="flex min-h-[220px] items-center justify-center gap-4">
            <Spinner size={30} />
            <p className="text-sm text-slate-600">Fetching donors, support programs, reminders, and analytics.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        subtitle="Monitor system activity, review records, and manage education operations."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin Panel' }]}
        action={refreshAction}
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
        <Card
          title="Operations overview"
          description="Cross-module totals for the current admin session."
          className="relative overflow-hidden"
        >
          <div className="brand-orb brand-orb-cyan -right-8 -top-12 h-32 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-3 font-display text-3xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}>
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">{item.helper}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="System pulse" description="Live sync status and the next scheduled reminder." className="relative overflow-hidden">
          <div className="brand-orb brand-orb-indigo -right-12 top-8 h-28 w-28" />
          <div className="rounded-[24px] bg-gradient-to-br from-brand-50 via-white to-accent-50 p-4 ring-1 ring-brand-100/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Last sync</p>
            <p className="mt-2 font-display text-lg font-semibold text-slate-900">
              {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Not synced yet'}
            </p>
            <p className="mt-2 text-sm text-slate-500">{refreshing ? 'Live refresh in progress.' : 'Data is ready for review.'}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next reminder</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {nextReminder ? nextReminder.patientEmail : 'No reminders scheduled'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {nextReminder ? formatDateTime(nextReminder.reminderDate) : 'Review reminder schedules to populate this.'}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Upcoming in 7 days</p>
              <p className="mt-2 font-display text-3xl font-semibold text-slate-900">{upcomingReminderCount}</p>
              <p className="mt-1 text-xs text-slate-500">Short-term reminder workload across the registry.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Priority goals</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {goalHighlights.length === 0 ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  No reminder goals yet
                </span>
              ) : (
                goalHighlights.map((item) => (
                  <span key={item.goal} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.goal} ({item.count})
                  </span>
                ))
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="Support provider mix">
          {providerChartData.length === 0 ? (
            <EmptyChart message="Provider analytics will appear after support programs are available." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={providerChartData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {providerChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Women reminder stages">
          {stageChartData.length === 0 ? (
            <EmptyChart message="Stage analytics will appear after reminders are created." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Reminder and support trend">
          <div className="mb-3 flex justify-end">
            <select
              value={chartRange}
              onChange={(event) => setChartRange(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time</option>
            </select>
          </div>

          {monthlyTrendChartData.length === 0 ? (
            <EmptyChart message="Trend data will appear once monthly activity exists." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reminders" stroke="#7c3aed" strokeWidth={3} />
                  <Line type="monotone" dataKey="supportPrograms" stroke="#0f766e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Latest blood donors" description="Quick registry snapshot for admin review.">
          <div className="space-y-3">
            {bloodDonors.slice(0, 5).map((donor) => (
              <div key={getRecordId(donor) || donor.name} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{donor.name}</p>
                <p className="text-xs text-slate-500">{donor.bloodGroup} / {donor.location}</p>
              </div>
            ))}
            {bloodDonors.length === 0 ? <p className="text-sm text-slate-500">No blood donors registered yet.</p> : null}
          </div>
        </Card>

        <Card title="Latest organ donors" description="Recent donor registrations across the organ module.">
          <div className="space-y-3">
            {organDonors.slice(0, 5).map((donor) => (
              <div key={getRecordId(donor) || donor.name} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{donor.name}</p>
                <p className="text-xs text-slate-500">{donor.organType} / {donor.location}</p>
              </div>
            ))}
            {organDonors.length === 0 ? <p className="text-sm text-slate-500">No organ donors registered yet.</p> : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <Card title="Manage support programs" description="Create and update support listings shown in Health Education.">
          <form onSubmit={saveSupportProgram} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={supportForm.providerType}
                onChange={(event) => {
                  const providerType = event.target.value
                  const defaults = PROVIDER_DEFAULTS[providerType] || PROVIDER_DEFAULTS.central
                  setSupportForm((prev) => ({
                    ...prev,
                    providerType,
                    provider: defaults.provider,
                    badge: defaults.badge,
                  }))
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="central">Central Government</option>
                <option value="state">State Government</option>
                <option value="who">WHO</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                value={supportForm.coverage}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, coverage: event.target.value }))}
                placeholder="Coverage %"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={supportForm.provider}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, provider: event.target.value }))}
                placeholder="Provider name"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={supportForm.badge}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, badge: event.target.value }))}
                placeholder="Badge label"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <input
              value={supportForm.programName}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, programName: event.target.value }))}
              placeholder="Program name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={supportForm.support}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, support: event.target.value }))}
              placeholder="Support summary"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={supportForm.link}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, link: event.target.value }))}
              placeholder="Official link"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={supportForm.accessSteps}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, accessSteps: event.target.value }))}
              placeholder="One access step per line"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={supportSaving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {supportSaving ? 'Saving...' : editingSupportId ? 'Update support program' : 'Save support program'}
              </button>
              {editingSupportId ? (
                <button
                  type="button"
                  onClick={resetSupportForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card title="Scheduled women health reminders" description="Search, review, and update patient reminder items.">
          <input
            value={reminderQuery}
            onChange={(event) => setReminderQuery(event.target.value)}
            placeholder="Search by email, stage, goal, or note"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="space-y-3">
            {filteredReminders.slice(0, 8).map((reminder) => {
              const reminderId = getRecordId(reminder)

              return (
                <div key={reminderId} className="rounded-xl border border-slate-200 p-4">
                  {editingReminderId === reminderId ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900">{reminder.patientEmail}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={reminderForm.reminderType}
                          onChange={(event) => setReminderForm((prev) => ({ ...prev, reminderType: event.target.value }))}
                          placeholder="Reminder type"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="datetime-local"
                          value={reminderForm.reminderDate}
                          onChange={(event) => setReminderForm((prev) => ({ ...prev, reminderDate: event.target.value }))}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={reminderForm.stage}
                          onChange={(event) => setReminderForm((prev) => ({ ...prev, stage: event.target.value }))}
                          placeholder="Stage"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={reminderForm.goal}
                          onChange={(event) => setReminderForm((prev) => ({ ...prev, goal: event.target.value }))}
                          placeholder="Goal"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <textarea
                        value={reminderForm.notes}
                        onChange={(event) => setReminderForm((prev) => ({ ...prev, notes: event.target.value }))}
                        rows={3}
                        placeholder="Notes"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveReminderEdit(reminderId)}
                          disabled={reminderSavingId === reminderId}
                          className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reminderSavingId === reminderId ? 'Saving...' : 'Save reminder'}
                        </button>
                        <button
                          type="button"
                          onClick={resetReminderForm}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{reminder.patientEmail}</p>
                      <p className="text-xs text-slate-600">
                        {reminder.reminderType} / {reminder.stage} / {reminder.goal}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(reminder.reminderDate)}</p>
                      <p className="text-xs text-slate-500">{reminder.notes || 'No notes'}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditReminder(reminder)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit reminder
                        </button>
                        <button
                          type="button"
                          onClick={() => removeReminder(reminderId)}
                          disabled={reminderDeletingId === reminderId}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reminderDeletingId === reminderId ? 'Deleting...' : 'Delete reminder'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {filteredReminders.length === 0 ? <p className="text-sm text-slate-500">No reminders match the current filter.</p> : null}
          </div>
        </Card>
      </section>

      <section>
        <Card title="Current support programs" description="Search, filter, and update education support listings.">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={supportQuery}
                onChange={(event) => setSupportQuery(event.target.value)}
                placeholder="Search by provider, badge, or program"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:w-72"
              />
              <select
                value={providerFilter}
                onChange={(event) => setProviderFilter(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All providers</option>
                <option value="central">Central</option>
                <option value="state">State</option>
                <option value="who">WHO</option>
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Showing {filteredSupportPrograms.length} of {supportPrograms.length} programs.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Coverage</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupportPrograms.slice(0, 12).map((program) => {
                  const programId = getRecordId(program)

                  return (
                    <tr key={programId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{program.provider}</td>
                      <td className="px-4 py-3 text-slate-600">{program.programName}</td>
                      <td className="px-4 py-3 text-slate-600">{program.coverage}%</td>
                      <td className="px-4 py-3 text-slate-600">{program.badge}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditSupportProgram(program)}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSupportProgram(programId)}
                            disabled={supportDeletingId === programId}
                            className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {supportDeletingId === programId ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredSupportPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                      No support programs match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
