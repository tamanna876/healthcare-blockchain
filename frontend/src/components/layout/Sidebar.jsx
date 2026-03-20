import { Link, useLocation } from 'react-router-dom'
import {
  AcademicCapIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext.jsx'

const baseItems = [
  { name: 'Dashboard', to: '/dashboard', icon: Squares2X2Icon },
  { name: 'Profile', to: '/profile', icon: UsersIcon },
]

const roleItems = {
  Patient: [
    { name: 'Patient Portal', to: '/patient-portal', icon: DocumentTextIcon },
    { name: 'Digital Wallet', to: '/digital-wallet', icon: CreditCardIcon },
    { name: 'Health Goals', to: '/health-goals', icon: TrophyIcon },
    { name: 'Family Access', to: '/family-access', icon: UserGroupIcon },
    { name: 'Health Education', to: '/health-education', icon: AcademicCapIcon },
    { name: 'Blood Donation', to: '/blood-donation', icon: HeartIcon },
    { name: 'Organ Donation', to: '/organ-donation', icon: ShieldCheckIcon },
  ],
  Doctor: [
    { name: 'Medical Records', to: '/medical-records', icon: DocumentTextIcon },
    { name: 'Clinical Trials', to: '/clinical-trials', icon: SparklesIcon },
    { name: 'Doctor Center', to: '/doctor-center', icon: ClipboardDocumentCheckIcon },
  ],
  Hospital: [
    { name: 'Medical Records', to: '/medical-records', icon: DocumentTextIcon },
    { name: 'Blood Donation', to: '/blood-donation', icon: HeartIcon },
    { name: 'Organ Donation', to: '/organ-donation', icon: ShieldCheckIcon },
    { name: 'Medicine Verification', to: '/medicine-verification', icon: ClipboardDocumentCheckIcon },
  ],
  Pharmacy: [
    { name: 'Medicine Verification', to: '/medicine-verification', icon: ClipboardDocumentCheckIcon },
    { name: 'Pharmacy Center', to: '/pharmacy-center', icon: SparklesIcon },
  ],
  Admin: [
    { name: 'Medical Records', to: '/medical-records', icon: DocumentTextIcon },
    { name: 'Blood Donation', to: '/blood-donation', icon: HeartIcon },
    { name: 'Organ Donation', to: '/organ-donation', icon: ShieldCheckIcon },
    { name: 'Medicine Verification', to: '/medicine-verification', icon: ClipboardDocumentCheckIcon },
    { name: 'Clinical Trials', to: '/clinical-trials', icon: SparklesIcon },
    { name: 'Doctor Center', to: '/doctor-center', icon: ClipboardDocumentCheckIcon },
    { name: 'Pharmacy Center', to: '/pharmacy-center', icon: SparklesIcon },
    { name: 'Admin Panel', to: '/admin', icon: UsersIcon },
  ],
}

export default function Sidebar({ mobile = false }) {
  const location = useLocation()
  const { logout, role, email } = useAuth()

  const navItems = [...baseItems, ...(roleItems[role] || [])]

  return (
    <aside className={`${mobile ? 'block' : 'hidden lg:block'} w-72 shrink-0 border-r border-white/70 bg-white/70 backdrop-blur-xl`}>
      <div className="flex h-full flex-col">
        <div className="px-5 py-5">
          <div className="brand-glass rounded-[28px] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-sm font-extrabold text-white shadow-lg shadow-brand-600/20">
                HT
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-slate-900">Healthcare Trust</p>
                <p className="mt-1 text-xs text-slate-500">Secure care command center</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50/90 px-3 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">{role || 'Guest'}</p>
              <p className="mt-1 truncate">{email || 'Not signed in'}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col px-3 pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-50 via-white to-accent-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
                    : 'text-slate-600 hover:bg-white/90 hover:text-slate-900'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/70 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
