import { Link } from 'react-router-dom'
import { Bars3Icon, BoltIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Navbar({ onOpenSidebar }) {
  const { role, email } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-white/70 bg-white/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          onClick={onOpenSidebar}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25">
            HT
          </div>
          <div className="hidden md:block">
            <p className="font-display text-sm font-semibold text-slate-900">Healthcare Trust</p>
            <p className="text-xs text-slate-500">Secure care operations network</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="brand-chip hidden md:inline-flex">
          <BoltIcon className="h-4 w-4 text-brand-600" />
          Live care workspace
        </div>

        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm md:flex">
          <span className="font-medium text-slate-900">{role || 'Guest'}</span>
          <span className="hidden md:inline text-slate-300">/</span>
          <span className="hidden md:inline">{email || 'Not signed in'}</span>
        </div>

        <Link
          to="/profile"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          Profile
        </Link>
      </div>
    </header>
  )
}
