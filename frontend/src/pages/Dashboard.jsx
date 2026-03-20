import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import ActivityChart from '../components/charts/ActivityChart.jsx'

const allModules = [
  {
    title: 'Medical Records',
    description: 'Create and lookup patient medical records on the chain.',
    href: '/medical-records',
    roles: ['Doctor', 'Hospital', 'Admin'],
  },
  {
    title: 'Patient Portal',
    description: 'Access your personal health records and resources.',
    href: '/patient-portal',
    roles: ['Patient'],
  },
  {
    title: 'Blood Donation',
    description: 'Register donors and search through compatible blood groups.',
    href: '/blood-donation',
    roles: ['Patient', 'Doctor', 'Hospital', 'Admin'],
  },
  {
    title: 'Organ Donation',
    description: 'Sign up donors and match organs for transplant requests.',
    href: '/organ-donation',
    roles: ['Patient', 'Doctor', 'Hospital', 'Admin'],
  },
  {
    title: 'Medicine Verification',
    description: 'Verify medicine IDs to prevent counterfeit drugs.',
    href: '/medicine-verification',
    roles: ['Pharmacy', 'Doctor', 'Hospital', 'Admin'],
  },
  {
    title: 'Clinical Trials',
    description: 'Upload and browse trial data with audit-friendly records.',
    href: '/clinical-trials',
    roles: ['Doctor', 'Admin'],
  },
  {
    title: 'Doctor Center',
    description: 'Review and confirm patient appointments.',
    href: '/doctor-center',
    roles: ['Doctor'],
  },
  {
    title: 'Pharmacy Center',
    description: 'Manage prescription refill requests.',
    href: '/pharmacy-center',
    roles: ['Pharmacy'],
  },
]

export default function Dashboard() {
  const { role, hasRole } = useAuth()

  const availableModules = useMemo(
    () => allModules.filter((module) => module.roles.includes(role)),
    [role],
  )

  const status = useMemo(
    () => ({
      records: 124,
      donors: 87,
      trials: 16,
      verifications: 52,
    }),
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your Decentralized Healthcare Trust System dashboard."
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Activity overview" description="Recent platform activity" className="p-6">
          <ActivityChart />
        </Card>

        <Card title="Quick metrics" description="System usage at a glance." className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="text-sm font-medium text-brand-700">Total records</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{status.records}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Donors</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{status.donors}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Trials</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{status.trials}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Verifications</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{status.verifications}</p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Your modules</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quick access to the tools you can use with the current role.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {availableModules.length === 0 ? (
            <Card title="No tools available" description="Your role does not have access to any modules." />
          ) : (
            availableModules.map((module) => (
              <Link
                key={module.href}
                to={module.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
              >
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                <div className="mt-4 inline-flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{role}</span>
                  <span className="text-brand-700">Go</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
