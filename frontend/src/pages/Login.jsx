import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const ROLES = ['patient', 'doctor', 'hospital', 'pharmacy', 'admin']

export default function Login() {
  const { isAuthenticated, login, register, loginWithWallet } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')   // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ email, password, role, displayName })
      }
    } catch (e) {
      setError(e.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  const handleMetaMaskLogin = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithWallet()
    } catch (e) {
      setError(e.message || 'MetaMask authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-lg shadow-slate-200/50 backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === 'login' ? 'Sign in to the platform' : 'Create an account'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'login'
              ? 'Enter your credentials to continue.'
              : 'Fill in your details to register.'}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Display Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Kumar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (mode === 'login' ? 'Signing in…' : 'Registering…') : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handleMetaMaskLogin}
                disabled={busy}
                className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Connecting…' : 'Continue with MetaMask'}
              </button>
            )}

            <p className="text-center text-xs text-slate-500">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                className="text-brand-600 hover:underline"
              >
                {mode === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
