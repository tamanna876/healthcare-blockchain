import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BeakerIcon,
  CheckBadgeIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const capabilities = [
  {
    title: 'Tamper-aware medical records',
    description: 'Anchor sensitive record activity to blockchain-backed workflows without losing day-to-day usability.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Care coordination and donation matching',
    description: 'Bring donors, hospitals, and patient-facing modules into one operational system.',
    icon: HeartIcon,
  },
  {
    title: 'Medicine and trial traceability',
    description: 'Track authenticity, trial status, and updates with audit-friendly history across the platform.',
    icon: BeakerIcon,
  },
  {
    title: 'Role-based healthcare operations',
    description: 'Patients, doctors, pharmacies, hospitals, and admins each get a focused workspace.',
    icon: UserGroupIcon,
  },
]

const metrics = [
  { label: 'Core roles', value: '5', detail: 'Patient, Doctor, Pharmacy, Hospital, Admin' },
  { label: 'Key modules', value: '10+', detail: 'Records, donations, trials, reminders, education, and more' },
  { label: 'Trust layers', value: '3', detail: 'MongoDB, IPFS, and Ethereum-compatible contract flows' },
]

const workflowHighlights = [
  'Patient check-in to prescription handoff in one path',
  'Doctor and pharmacy views designed for fast actions',
  'Admin oversight with clean, role-safe operational controls',
]

const launchSequence = [
  { step: '01', title: 'Authenticate', detail: 'Sign in with role-aware access and token-based sessions.' },
  { step: '02', title: 'Coordinate', detail: 'Move across appointments, records, and donation modules.' },
  { step: '03', title: 'Verify', detail: 'Confirm critical entries with blockchain-linked trust checks.' },
]

const quickActions = [
  {
    step: '1',
    title: 'Test APIs',
    description: 'Check health, tokens, certificates, and approval endpoints from the backend.',
    to: '/dashboard',
  },
  {
    step: '2',
    title: 'Start multi-node',
    description: 'Use the decentralized stack with Docker, MongoDB, and Nginx load balancing.',
    to: '/admin',
  },
  {
    step: '3',
    title: 'Deploy contracts',
    description: 'Move from local demos to contract-backed healthcare trust flows.',
    to: '/medical-records',
  },
  {
    step: '4',
    title: 'Explore UI modules',
    description: 'Open patient, doctor, pharmacy, and wallet workspaces from one place.',
    to: '/patient-portal',
  },
  {
    step: '5',
    title: 'Production setup',
    description: 'Review deployment, environment, and quick-start guidance before launch.',
    to: '/login',
  },
]

const apiChecks = [
  { label: 'Backend health', url: 'http://localhost:5000/health' },
  { label: 'Frontend app', url: 'http://localhost:5173/' },
  { label: 'Token holders API', url: 'http://localhost:5000/api/tokens/holders' },
]

const dockerSteps = [
  'Copy .env.example to .env and set blockchain and database values.',
  'Run docker-compose up -d from the project root.',
  'Check /health on each backend node and confirm the Nginx proxy.',
]

const contractRoutes = [
  { label: 'Medical Records', to: '/medical-records', note: 'Record and verify patient data flows.' },
  { label: 'Blood Donation', to: '/blood-donation', note: 'Match donors and reward donations.' },
  { label: 'Organ Donation', to: '/organ-donation', note: 'Handle urgent organ matching flows.' },
  { label: 'Medicine Verification', to: '/medicine-verification', note: 'Verify inventory and authenticity.' },
]

const productionChecklist = [
  'Set RPC_URL, PRIVATE_KEY, and contract addresses in .env.',
  'Run npm install in backend and frontend before starting services.',
  'Test /health and API routes before opening the dashboard.',
  'Use docker-compose for multi-node or production-style deployment.',
  'Review the quick-start and deployment guide before launch.',
]

const moduleNavigation = [
  { label: 'Patient portal', to: '/patient-portal' },
  { label: 'Doctor center', to: '/doctor-center' },
  { label: 'Pharmacy center', to: '/pharmacy-center' },
  { label: 'Digital wallet', to: '/digital-wallet' },
  { label: 'Health goals', to: '/health-goals' },
]

export default function Home() {
  const openExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="brand-grid relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
      <div className="brand-orb brand-orb-cyan -left-24 top-10 h-80 w-80" />
      <div className="brand-orb brand-orb-indigo right-0 top-32 h-96 w-96" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[30px] border border-white/70 bg-white/70 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25">
              HT
            </div>
            <div>
              <p className="font-display text-base font-semibold text-slate-900">Healthcare Trust</p>
              <p className="text-xs text-slate-500">Secure care infrastructure for modern health systems</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="brand-chip">
              <SparklesIcon className="h-4 w-4 text-brand-600" />
              Blockchain-backed care coordination
            </span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="brand-glass relative overflow-hidden rounded-[34px] px-7 py-8 sm:px-10 sm:py-10">
            <div className="brand-orb brand-orb-cyan right-0 top-0 h-40 w-40" />
            <span className="brand-chip">
              <CheckBadgeIcon className="h-4 w-4 text-brand-600" />
              Live healthcare demo with enterprise-ready architecture
            </span>

            <h1 className="font-display mt-6 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Healthcare operations with stronger trust, clearer audit trails, and a more connected patient journey.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Healthcare Trust brings medical records, donor registries, medicine verification, clinical trials,
              reminders, and role-based collaboration into one polished healthcare platform powered by modern web and
              blockchain tooling.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Enter the platform
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              <a
                href="#capabilities"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Explore capabilities
              </a>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 font-display text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="brand-glass rounded-[30px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Launch flow</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-slate-900">Care command deck</h2>

              <div className="mt-6 space-y-3">
                {launchSequence.map((item) => (
                  <div key={item.step} className="rounded-2xl border border-slate-200 bg-white/95 p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-display text-sm font-semibold text-brand-700">{item.step}</span>
                      <div>
                        <p className="font-display text-base font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="brand-glass rounded-[30px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Team advantage</p>
              <h3 className="font-display mt-2 text-xl font-semibold text-slate-900">Built for real healthcare collaboration</h3>
              <div className="mt-4 space-y-3">
                {workflowHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40">
                    <CheckBadgeIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <p className="text-sm text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((capability) => {
            const Icon = capability.icon

            return (
              <article
                key={capability.title}
                className="brand-glass rounded-[28px] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="font-display mt-5 text-xl font-semibold text-slate-900">{capability.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{capability.description}</p>
              </article>
            )
          })}
        </section>

        <section className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Quick actions</p>
              <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">
                The 1-5 path for setup, deployment, and the main app flows
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use this strip to move from API checks to multi-node deployment, contracts, UI modules, and the final
                production-ready handoff.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Link
                key={action.step}
                to={action.to}
                className="group rounded-[26px] border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-brand-700">0{action.step}</span>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">API test button</p>
                <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">Quick backend verification</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Use this to confirm the backend is live before you move to the dashboard or deployment steps.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openExternal('http://localhost:5000/health')}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Open API health check
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {apiChecks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openExternal(item.url)}
                  className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-left shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="font-display text-base font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.url}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Docker multi-node start guide</p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">Production-style startup flow</h2>

            <div className="mt-6 space-y-3">
              {dockerSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40">
                  <span className="font-display text-sm font-semibold text-brand-700">0{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => copyText('docker-compose up -d')}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Copy docker command
              </button>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Open admin guide
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Contract deployment links</p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">Jump to the contract-backed modules</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {contractRoutes.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="font-display text-base font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Production setup checklist</p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">Go-live readiness</h2>

            <div className="mt-6 space-y-3">
              {productionChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40">
                  <CheckBadgeIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Direct module navigation</p>
          <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">Move straight into the app modules</h2>

          <div className="mt-6 flex flex-wrap gap-3">
            {moduleNavigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="brand-glass rounded-[34px] px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Ready to explore</p>
              <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">
                Step into a more confident healthcare demo environment
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use the app to walk through role-based flows, admin oversight, healthcare education tools, and
                blockchain-linked trust features from one consistent interface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Launch dashboard
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Review role access
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
