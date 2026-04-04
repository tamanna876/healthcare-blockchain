/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
  updateProfile as apiUpdateProfile,
  removeToken,
  requestWalletNonce,
  verifyWalletSignature,
} from '../services/api'

const AuthContext = createContext(null)

const initialState = {
  isAuthenticated: false,
  role: null,
  email: null,
  displayName: null,
  phone: null,
  loginAt: null,
  healthId: null,
  walletAddress: null,
}

function normalizeRole(role) {
  if (!role || typeof role !== 'string') return role
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

function normalizeAllowedRole(role) {
  return normalizeRole(role)
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(initialState)
  const [loading, setLoading] = useState(true)

  // On mount: validate stored JWT by calling /api/auth/me
  useEffect(() => {
    async function rehydrate() {
      try {
        const data = await getMe()
        if (data?.user) {
          setAuth({
            isAuthenticated: true,
            role: normalizeRole(data.user.role),
            email: data.user.email,
            displayName: data.user.displayName,
            phone: data.user.phone,
            healthId: data.user.healthId,
            walletAddress: data.user.walletAddress || null,
            loginAt: null,
          })
        }
      } catch (err) {
        // Token invalid or server offline – clear stale token
        console.log('[Auth] Rehydration failed (expected if logged out):', err.message)
        removeToken()
      } finally {
        setLoading(false)
      }
    }
    rehydrate()
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password })
    // Token already stored by loginUser() in api.js
    setAuth({
      isAuthenticated: true,
      role: normalizeRole(data.user.role),
      email: data.user.email,
      displayName: data.user.displayName,
      phone: data.user.phone,
      healthId: data.user.healthId,
      walletAddress: data.user.walletAddress || null,
      loginAt: new Date().toISOString(),
    })
    navigate('/dashboard', { replace: true })
    return data
  }, [navigate])

  const register = useCallback(async ({ email, password, role, displayName, phone }) => {
    const data = await registerUser({ email, password, role, displayName, phone })
    setAuth({
      isAuthenticated: true,
      role: normalizeRole(data.user.role),
      email: data.user.email,
      displayName: data.user.displayName,
      phone: data.user.phone,
      healthId: data.user.healthId,
      walletAddress: data.user.walletAddress || null,
      loginAt: new Date().toISOString(),
    })
    navigate('/dashboard', { replace: true })
    return data
  }, [navigate])

  const loginWithWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install the MetaMask extension.')
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const walletAddress = Array.isArray(accounts) ? accounts[0] : null
    if (!walletAddress) {
      throw new Error('No wallet account selected')
    }

    const challenge = await requestWalletNonce(walletAddress)
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [challenge.message, walletAddress],
    })

    const data = await verifyWalletSignature({ walletAddress, signature })
    setAuth({
      isAuthenticated: true,
      role: normalizeRole(data.user.role),
      email: data.user.email,
      displayName: data.user.displayName,
      phone: data.user.phone,
      healthId: data.user.healthId,
      walletAddress: data.user.walletAddress || walletAddress,
      loginAt: new Date().toISOString(),
    })
    navigate('/dashboard', { replace: true })
    return data
  }, [navigate])

  const logout = useCallback(() => {
    logoutUser()
    setAuth(initialState)
    navigate('/login', { replace: true })
  }, [navigate])

  const updateProfile = useCallback(async ({ displayName, phone }) => {
    const data = await apiUpdateProfile({ displayName, phone })
    setAuth((prev) => ({ ...prev, displayName: data.user.displayName, phone: data.user.phone }))
  }, [])

  const hasRole = useCallback((allowedRoles) => {
    if (!auth.role) return false
    return Array.isArray(allowedRoles)
      ? allowedRoles.map(normalizeAllowedRole).includes(auth.role)
      : auth.role === normalizeAllowedRole(allowedRoles)
  }, [auth.role])

  const value = useMemo(
    () => ({ ...auth, loading, login, register, loginWithWallet, logout, hasRole, updateProfile }),
    [auth, loading, login, register, loginWithWallet, logout, hasRole, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
