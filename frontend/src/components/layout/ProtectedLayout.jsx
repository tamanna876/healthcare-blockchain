import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import FloatingChatbot from '../FloatingChatbot.jsx'
import EmergencySOS from '../EmergencySOS.jsx'
import DarkModeToggle from '../DarkModeToggle.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // While the JWT rehydration check is in flight, show a loader instead of
  // immediately redirecting to /login (which would break deep links after refresh)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
      <div className="brand-orb brand-orb-cyan -left-20 top-24 h-64 w-64" />
      <div className="brand-orb brand-orb-indigo right-0 top-16 h-72 w-72" />
      <Navbar onOpenSidebar={() => setMobileOpen(true)} />
      <div className="flex">
        <Sidebar />
        <main className="relative z-10 flex-1 px-4 py-6 lg:px-10">
          <Outlet />
        </main>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl lg:hidden">
          <Sidebar mobile />
        </div>
      ) : null}

      <FloatingChatbot />
      <EmergencySOS />
      <DarkModeToggle />
    </div>
  )
}
