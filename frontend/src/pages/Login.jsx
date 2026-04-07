import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const ROLES = ['patient', 'doctor', 'hospital', 'pharmacy', 'admin']

export default function Login() {
  const { isAuthenticated, login, register, loginWithWallet, requestMagicLoginCode, verifyMagicLoginCode, loginWithIdentityProvider, loginWithGoogleToken } = useAuth()
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const [mode, setMode] = useState('login')   // 'login' | 'register'
  const [loginMethod, setLoginMethod] = useState('password') // password | magic | identity
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  const runDemoLogin = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const demoEmail = `demo.user+${new Date().getTime()}@demo.local`
      await loginWithIdentityProvider({
        email: demoEmail,
        provider: 'email',
        displayName: 'Demo User',
        role: 'patient',
        emailVerified: true,
      })
    } catch (e) {
      setError(e.message || 'Demo login failed.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (mode !== 'login' || loginMethod !== 'identity') return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setGoogleReady(false)
      return
    }

    let cancelled = false

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            setError('Google credential not received. Please try again.')
            return
          }

          setError('')
          setSuccess('')
          setBusy(true)

          try {
            await loginWithGoogleToken({ idToken: response.credential, role })
          } catch (e) {
            setError(e.message || 'Google sign-in failed.')
          } finally {
            setBusy(false)
          }
        },
      })

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 360,
      })
      setGoogleReady(true)
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
      return () => {
        cancelled = true
      }
    }

    const scriptId = 'google-identity-services'
    let script = document.getElementById(scriptId)
    const onLoad = () => initializeGoogle()

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.addEventListener('load', onLoad)
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', onLoad)
    }

    return () => {
      cancelled = true
      script?.removeEventListener('load', onLoad)
    }
  }, [loginMethod, mode, role, loginWithGoogleToken])

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    try {
      if (mode === 'login' && loginMethod === 'password') {
        await login({ email, password })
      } else if (mode === 'login' && loginMethod === 'magic') {
        const response = await requestMagicLoginCode({ email, role, displayName })
        setSuccess(response?.code ? `Magic code (dev): ${response.code}` : 'Magic login code sent to email.')
      } else if (mode === 'login' && loginMethod === 'identity') {
        await loginWithIdentityProvider({
          email,
          provider: hasGoogleClientId ? 'google' : 'email',
          displayName,
          role,
          emailVerified: true,
        })
      } else {
        try {
          await register({ email, password, role, displayName })
        } catch (registerError) {
          const message = registerError?.message || ''
          if (/already\s*registered|email\s*already/i.test(message)) {
            await login({ email, password })
            setSuccess('Existing account found. Signed in successfully.')
          } else {
            throw registerError
          }
        }
      }
    } catch (e) {
      setError(e.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  const handleMetaMaskLogin = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await loginWithWallet()
    } catch (e) {
      setError(e.message || 'MetaMask authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleMagicVerify = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await verifyMagicLoginCode({ email, code })
    } catch (e) {
      setError(e.message || 'Magic login verification failed.')
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

          <button
            type="button"
            onClick={runDemoLogin}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Please wait...' : 'One-click Demo Login'}
          </button>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === 'login' && (
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
                {[
                  ['password', 'Email + Password'],
                  ['magic', 'Email Code'],
                  ['identity', hasGoogleClientId ? 'Google/Email' : 'Email Identity'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setLoginMethod(value); setError(''); setSuccess('') }}
                    className={`rounded-xl px-3 py-2 transition ${loginMethod === value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

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
                disabled={mode === 'login' && loginMethod !== 'password'}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            {mode === 'login' && loginMethod === 'magic' && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Magic Code</span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ABC123"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleMagicVerify}
                  disabled={busy}
                  className="flex w-full items-center justify-center rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Verifying…' : 'Verify code and sign in'}
                </button>
              </>
            )}

            {mode === 'login' && loginMethod === 'identity' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  {hasGoogleClientId
                    ? 'Use the Google button for OAuth sign-in, or fallback to direct identity login using email.'
                    : 'Google OAuth is unavailable. Continue using direct identity login with email.'}
                </p>
                {!hasGoogleClientId && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                    Set <strong>VITE_GOOGLE_CLIENT_ID</strong> in your frontend env to enable real Google OAuth.
                  </p>
                )}
                {hasGoogleClientId && <div ref={googleButtonRef} className="min-h-[44px]" />}
                {hasGoogleClientId && !googleReady && (
                  <p className="text-xs text-slate-500">Loading Google sign-in...</p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setError('')
                    setSuccess('')
                    setBusy(true)
                    try {
                      await loginWithIdentityProvider({
                        email,
                        provider: 'email',
                        displayName,
                        role,
                        emailVerified: true,
                      })
                    } catch (e) {
                      setError(e.message || 'Direct identity login failed.')
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Please wait...' : 'Fallback: Continue with direct email identity'}
                </button>
              </div>
            )}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (mode === 'login' ? 'Signing in…' : 'Registering…') : (mode === 'login' ? (loginMethod === 'magic' ? 'Send magic code' : loginMethod === 'identity' ? (hasGoogleClientId ? 'Continue with Google/Email' : 'Continue with Email Identity') : 'Sign in') : 'Create account')}
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
