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

/* ─── Token helpers ─────────────────────────────────────── */

export function getToken() {
  try { return window.localStorage.getItem('dhts_token') || null } catch { return null }
}

export function setToken(token) {
  window.localStorage.setItem('dhts_token', token)
}

export function removeToken() {
  window.localStorage.removeItem('dhts_token')
}

/* ─── Core request helper ───────────────────────────────── */

async function request(path, { method = 'GET', body, auth = true, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const text = await res.text()
    try { throw new Error(JSON.parse(text).message || `API error ${res.status}`) }
    catch { throw new Error(`API error ${res.status}: ${text}`) }
  }

  return res.status === 204 ? null : res.json()
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

export function logoutUser() { removeToken() }

export async function getMe() { return request('/api/auth/me') }

export async function updateProfile({ displayName, phone }) {
  return request('/api/auth/profile', { method: 'PUT', body: { displayName, phone } })
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
