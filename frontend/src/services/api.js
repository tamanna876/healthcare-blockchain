/**
 * frontend/src/services/api.js
 *
 * Centralised API service layer.
 * All async calls go to the Express backend (VITE_API_URL, default http://localhost:5000).
 * JWT token is read from localStorage and attached to every authenticated request.
 * Health-Education support programs and Women-health reminders keep localStorage fallback
 * because they are frontend-only UI features with no dedicated backend model.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
let pendingRefreshPromise = null

/* ─── Token helpers ─────────────────────────────────────── */

export function getToken() {
  try { return window.localStorage.getItem('dhts_token') || null } catch { return null }
}

export function getRefreshToken() {
  return null
}

export function setToken(token) {
  window.localStorage.setItem('dhts_token', token)
}

export function setRefreshToken(refreshToken) {
  // Refresh token now lives in secure httpOnly cookie.
  void refreshToken
}

export function setSessionTokens(token, refreshToken) {
  if (token) setToken(token)
  if (refreshToken) setRefreshToken(refreshToken)
}

export function removeToken() {
  window.localStorage.removeItem('dhts_token')
}

export function removeRefreshToken() {
  // Refresh token now lives in secure httpOnly cookie.
}

export function clearSessionTokens() {
  removeToken()
  removeRefreshToken()
}

async function refreshAccessToken() {
  if (!pendingRefreshPromise) {
    pendingRefreshPromise = (async () => {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!res.ok) {
        clearSessionTokens()
        return false
      }

      const data = await res.json()
      if (data?.token) {
        setToken(data.token)
        return true
      }

      clearSessionTokens()
      return false
    })().finally(() => {
      pendingRefreshPromise = null
    })
  }

  return pendingRefreshPromise
}

/* ─── Core request helper ───────────────────────────────── */

async function request(path, { method = 'GET', body, auth = true, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    if (res.status === 401 && auth && !path.startsWith('/api/auth/')) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return request(path, {
          method,
          body,
          auth,
          ...options,
          headers: options.headers,
        })
      }
    }

    if (!res.ok) {
      const text = await res.text()
      try { throw new Error(JSON.parse(text).message || `API error ${res.status}`) }
      catch { throw new Error(`API error ${res.status}: ${text}`) }
    }

    return res.status === 204 ? null : res.json()
  } catch (err) {
    console.error(`[API] ${method} ${path} failed:`, err.message)
    throw err
  }
}

/* ─── Authentication ────────────────────────────────────── */

export async function registerUser({ email, password, role, displayName, phone }) {
  const data = await request('/api/auth/register', {
    method: 'POST', body: { email, password, role, displayName, phone }, auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function loginUser({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST', body: { email, password }, auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function requestWalletNonce(walletAddress) {
  return request('/api/auth/wallet/nonce', {
    method: 'POST',
    body: { walletAddress },
    auth: false,
  })
}

export async function verifyWalletSignature({ walletAddress, signature }) {
  const data = await request('/api/auth/wallet/verify', {
    method: 'POST',
    body: { walletAddress, signature },
    auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function requestMagicLogin({ email, role, displayName, phone, provider = 'email' }) {
  return request('/api/auth/magic/request', {
    method: 'POST',
    body: { email, role, displayName, phone, provider },
    auth: false,
  })
}

export async function verifyMagicLogin({ email, code }) {
  const data = await request('/api/auth/magic/verify', {
    method: 'POST',
    body: { email, code },
    auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function loginWithGoogleIdToken({ idToken, role }) {
  const data = await request('/api/auth/google', {
    method: 'POST',
    body: { idToken, role },
    auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function loginWithIdentity({ email, provider, providerId, displayName, phone, role, emailVerified = true }) {
  const data = await request('/api/auth/identity/login', {
    method: 'POST',
    body: { email, provider, providerId, displayName, phone, role, emailVerified },
    auth: false,
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function logoutUser() {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } catch {
    // Logout should always clear local session even when API is unavailable.
  } finally {
    clearSessionTokens()
  }
}

export async function logoutAllSessions() {
  try {
    await request('/api/auth/logout-all', { method: 'POST' })
  } finally {
    clearSessionTokens()
  }
}

export async function getActiveSessions() {
  return request('/api/auth/sessions')
}

export async function revokeSession(sessionId) {
  return request(`/api/auth/sessions/${encodeURIComponent(sessionId)}/revoke`, { method: 'POST' })
}

export async function getMe() { return request('/api/auth/me') }

export async function getAuthMethods() { return request('/api/auth/auth-methods') }

export async function updateProfile({ displayName, phone }) {
  return request('/api/auth/profile', { method: 'PUT', body: { displayName, phone } })
}

export async function getAdminMetrics() {
  return request('/api/admin/metrics')
}

export async function getAuditLogs(limit = 25) {
  return request(`/api/admin/audit-logs?limit=${limit}`)
}

export async function getObservability() {
  return request('/api/admin/observability')
}

export async function getNotificationPreferences() {
  return request('/api/notifications/preferences')
}

export async function updateNotificationPreferences(preferences) {
  return request('/api/notifications/preferences', { method: 'PUT', body: preferences })
}

export async function getMyNotifications(unreadOnly = false) {
  const query = unreadOnly ? '?unreadOnly=true' : ''
  return request(`/api/notifications/me${query}`)
}

export async function markNotificationRead(notificationId) {
  return request(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead(notificationIds = []) {
  void notificationIds
  return request('/api/notifications/read-all', { method: 'POST' })
}

export async function getConsentGrants() {
  const data = await request('/api/consents/mine')
  return data?.grants ?? []
}

export async function createConsentGrant(payload) {
  const data = await request('/api/consents', { method: 'POST', body: payload })
  return data?.grant
}

export async function revokeConsentGrant(id) {
  const data = await request(`/api/consents/${encodeURIComponent(id)}/revoke`, { method: 'POST' })
  return data?.grant
}

export async function extendConsentGrant(id, expiresAt) {
  const data = await request(`/api/consents/${encodeURIComponent(id)}/extend`, {
    method: 'POST',
    body: { expiresAt },
  })
  return data?.grant
}

export async function getTransactionNetwork() {
  return request('/api/transactions/network')
}

export async function getTransactionStatus(txHash) {
  return request(`/api/transactions/${encodeURIComponent(txHash)}/status`)
}

export async function getGasEstimate(txType, payload = {}) {
  return request('/api/transactions/estimate-gas', {
    method: 'POST',
    body: { txType, ...payload },
  })
}

export async function createEmergencySos(payload) {
  return request('/api/emergency/sos', { method: 'POST', body: payload })
}

/* ─── Medical Records (IPFS + Blockchain) ───────────────── */

export async function uploadMedicalFile(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/records/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function addMedicalRecord(patientAddress, ipfsHash) {
  return request('/api/records', { method: 'POST', body: { patient: patientAddress, ipfsHash } })
}

export async function getMedicalRecords(patientAddress) {
  const data = await request(`/api/records/${encodeURIComponent(patientAddress)}`)
  return data?.records ?? []
}

/* ─── Appointments ──────────────────────────────────────── */

export async function getAppointments() {
  const data = await request('/api/appointments')
  return data?.appointments ?? []
}

export async function saveAppointment({ doctor, date, time, reason }) {
  const data = await request('/api/appointments', { method: 'POST', body: { doctor, date, time, reason } })
  return data?.appointment
}

export async function updateAppointmentStatus(id, status, notes) {
  const data = await request(`/api/appointments/${id}/status`, { method: 'PATCH', body: { status, notes } })
  return data?.appointment
}

export async function deleteAppointment(id) {
  return request(`/api/appointments/${id}`, { method: 'DELETE' })
}

/* ─── Blood Donors ──────────────────────────────────────── */

export async function getBloodDonors(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await request(`/api/donors/blood${params ? `?${params}` : ''}`, { auth: false })
  return data?.donors ?? []
}

export async function saveBloodDonor({ name, bloodGroup, location, phone, donatedBefore, lastDonationDate }) {
  const data = await request('/api/donors/blood', {
    method: 'POST', body: { name, bloodGroup, location, phone, donatedBefore, lastDonationDate },
  })
  return data?.donor
}

/* ─── Organ Donors ──────────────────────────────────────── */

export async function getOrganDonors(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await request(`/api/donors/organ${params ? `?${params}` : ''}`, { auth: false })
  return data?.donors ?? []
}

export async function saveOrganDonor({ name, organType, bloodGroup, location, phone }) {
  const data = await request('/api/donors/organ', {
    method: 'POST', body: { name, organType, bloodGroup, location, phone },
  })
  return data?.donor
}

/* ─── Medicine Verification ─────────────────────────────── */

export async function getMedicines(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await request(`/api/medicines${params ? `?${params}` : ''}`, { auth: false })
  return data?.medicines ?? []
}

export async function verifyMedicine(medicineId) {
  return request(`/api/medicines/verify/${encodeURIComponent(medicineId)}`, { auth: false })
}

export async function addMedicineToInventory({ medicineId, name, manufacturer, batchNumber, manufactureDate, expiryDate, compositionTags }) {
  const data = await request('/api/medicines', {
    method: 'POST',
    body: { medicineId, name, manufacturer, batchNumber, manufactureDate, expiryDate, compositionTags },
  })
  return data?.medicine
}

/* ─── Clinical Trials ───────────────────────────────────── */

export async function getClinicalTrials(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const data = await request(`/api/trials${params ? `?${params}` : ''}`, { auth: false })
  return data?.trials ?? []
}

export async function saveClinicalTrial({ trialName, trialId, researcher, institution, phase, description, eligibilityCriteria }) {
  const data = await request('/api/trials', {
    method: 'POST',
    body: { trialName, trialId, researcher, institution, phase, description, eligibilityCriteria },
  })
  return data?.trial
}

/* ─── Prescriptions ─────────────────────────────────────── */

export async function getPrescriptions() {
  const data = await request('/api/prescriptions')
  return data?.prescriptions ?? []
}

export async function requestPrescriptionRefill({ medication, dosage, pharmacy, frequency, notes }) {
  const data = await request('/api/prescriptions', {
    method: 'POST', body: { medication, dosage, pharmacy, frequency, notes },
  })
  return data?.prescription
}

export async function updatePrescriptionStatus(id, status) {
  const data = await request(`/api/prescriptions/${id}/status`, { method: 'PATCH', body: { status } })
  return data?.prescription
}

/* ─── Health Education APIs ─────────────────────────────── */

export async function getHealthEducationSupportPrograms(providerType) {
  const query = providerType ? `?providerType=${encodeURIComponent(providerType)}` : ''
  const data = await request(`/api/education/support-programs${query}`, { auth: false })
  return data?.programs ?? []
}

export async function saveHealthEducationSupportProgram(program) {
  const data = await request('/api/education/support-programs', {
    method: 'POST',
    body: {
      providerType: program.providerType,
      provider: program.provider,
      badge: program.badge,
      coverage: Number(program.coverage) || 0,
      programName: program.programName,
      support: program.support,
      link: program.link,
      accessSteps: Array.isArray(program.accessSteps) ? program.accessSteps : [],
    },
  })
  return data?.program
}

export async function updateHealthEducationSupportProgram(id, program) {
  const data = await request(`/api/education/support-programs/${id}`, {
    method: 'PUT',
    body: {
      providerType: program.providerType,
      provider: program.provider,
      badge: program.badge,
      coverage: Number(program.coverage) || 0,
      programName: program.programName,
      support: program.support,
      link: program.link,
      accessSteps: Array.isArray(program.accessSteps) ? program.accessSteps : [],
    },
  })
  return data?.program
}

export async function deleteHealthEducationSupportProgram(id) {
  return request(`/api/education/support-programs/${id}`, { method: 'DELETE' })
}

export async function getWomenHealthReminders(patientEmail) {
  const query = patientEmail ? `?patientEmail=${encodeURIComponent(patientEmail)}` : ''
  const data = await request(`/api/education/women-reminders${query}`)
  return data?.reminders ?? []
}

export async function saveWomenHealthReminder(reminder) {
  const data = await request('/api/education/women-reminders', {
    method: 'POST',
    body: {
      language: reminder.language,
      stage: reminder.stage,
      goal: reminder.goal,
      reminderType: reminder.reminderType,
      reminderDate: reminder.reminderDate,
      notes: reminder.notes || '',
    },
  })
  return data?.reminder
}

export async function updateWomenHealthReminder(id, reminder) {
  const data = await request(`/api/education/women-reminders/${id}`, {
    method: 'PUT',
    body: {
      language: reminder.language,
      stage: reminder.stage,
      goal: reminder.goal,
      reminderType: reminder.reminderType,
      reminderDate: reminder.reminderDate,
      notes: reminder.notes || '',
    },
  })
  return data?.reminder
}

export async function deleteWomenHealthReminder(id) {
  return request(`/api/education/women-reminders/${id}`, { method: 'DELETE' })
}

export async function getHealthEducationAnalytics() {
  return request('/api/education/analytics')
}

/* ─── Innovation APIs ─────────────────────────────────── */

export async function evaluateSmartAccess(payload) {
  return request('/api/innovation/access-rules/evaluate', { method: 'POST', body: payload })
}

export async function createVaultShareLink(payload) {
  return request('/api/innovation/share-links', { method: 'POST', body: payload })
}

export async function revokeVaultShareLink(id) {
  return request(`/api/innovation/share-links/${encodeURIComponent(id)}/revoke`, { method: 'POST' })
}

export async function getClinicalTimeline(patientAddress) {
  return request(`/api/innovation/timeline/${encodeURIComponent(patientAddress)}`)
}

export async function getComplianceKpis() {
  return request('/api/innovation/compliance')
}

export async function ackLiveAlert(alertId, state, note = '') {
  return request(`/api/innovation/alerts/${encodeURIComponent(alertId)}/ack`, {
    method: 'POST',
    body: { state, note },
  })
}

export async function escalateLiveAlert(alertId, reason = '') {
  return request(`/api/innovation/alerts/${encodeURIComponent(alertId)}/escalate`, {
    method: 'POST',
    body: { reason },
  })
}

export async function getOfflineStatus() {
  return request('/api/innovation/offline/status')
}

export async function getOfflineCache(patientAddress) {
  return request(`/api/innovation/offline/cache/${encodeURIComponent(patientAddress)}`)
}

export async function queueOfflineAction(actionType, payload = {}) {
  return request('/api/innovation/offline/queue', {
    method: 'POST',
    body: { actionType, payload },
  })
}

export async function syncOfflineActions() {
  return request('/api/innovation/offline/sync', { method: 'POST' })
}

export async function signPrescriptionChain(id) {
  return request(`/api/innovation/prescriptions/${encodeURIComponent(id)}/sign`, { method: 'POST' })
}

export async function verifyDispenseChain(id) {
  return request(`/api/innovation/prescriptions/${encodeURIComponent(id)}/verify-dispense`, { method: 'POST' })
}

export async function getEmergencyFacilities(lat, lng) {
  const params = new URLSearchParams()
  if (lat !== undefined && lat !== null) params.set('lat', String(lat))
  if (lng !== undefined && lng !== null) params.set('lng', String(lng))
  const query = params.toString()
  return request(`/api/innovation/emergency/facilities${query ? `?${query}` : ''}`)
}

export async function runAdvancedSearch(q, role) {
  const params = new URLSearchParams({ q })
  if (role) params.set('role', role)
  return request(`/api/innovation/search?${params.toString()}`)
}

export async function saveAdvancedFilterView(payload) {
  return request('/api/innovation/search/saved-filters', { method: 'POST', body: payload })
}

export async function getAdvancedFilterViews() {
  return request('/api/innovation/search/saved-filters')
}

export async function getTrustRecords(patientAddress, context = 'normal') {
  return request(`/api/innovation/trust/records/${encodeURIComponent(patientAddress)}?context=${encodeURIComponent(context)}`)
}
