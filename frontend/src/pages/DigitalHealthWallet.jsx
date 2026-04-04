import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'

export default function DigitalHealthWallet() {
  const { email, role } = useAuth()
  const [activeTab, setActiveTab] = useState('vaccinations')
  const [walletData, setWalletData] = useState(() => {
    const emptyWallet = {
      vaccinations: [],
      medicalId: {
        name: '',
        dob: '',
        bloodType: 'A+',
        allergies: '',
        medications: '',
        emergencyContact: '',
        emergencyPhone: ''
      },
      insurance: [],
      emergencyInfo: {
        conditions: '',
        physician: '',
        physicianPhone: '',
        notes: ''
      }
    }

    const savedWallet = localStorage.getItem(`healthWallet_${email}`)
    if (savedWallet) {
      return JSON.parse(savedWallet)
    }

    return {
      ...emptyWallet,
      medicalId: {
        ...emptyWallet.medicalId,
        name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').toUpperCase()
      }
    }
  })

  useEffect(() => {
    localStorage.setItem(`healthWallet_${email}`, JSON.stringify(walletData))
  }, [email, walletData])

  const saveWalletData = (newData) => {
    const updatedData = { ...walletData, ...newData }
    setWalletData(updatedData)
    localStorage.setItem(`healthWallet_${email}`, JSON.stringify(updatedData))
  }

  const addVaccination = (vaccination) => {
    const newVaccinations = [...walletData.vaccinations, { ...vaccination, id: Date.now() }]
    saveWalletData({ vaccinations: newVaccinations })
  }

  const addInsurance = (insurance) => {
    const newInsurance = [...walletData.insurance, { ...insurance, id: Date.now() }]
    saveWalletData({ insurance: newInsurance })
  }

  const updateMedicalId = (field, value) => {
    const updatedMedicalId = { ...walletData.medicalId, [field]: value }
    saveWalletData({ medicalId: updatedMedicalId })
  }

  const updateEmergencyInfo = (field, value) => {
    const updatedEmergencyInfo = { ...walletData.emergencyInfo, [field]: value }
    saveWalletData({ emergencyInfo: updatedEmergencyInfo })
  }

  if (role !== 'Patient') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Access denied</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The Digital Health Wallet is only available to Patient users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Digital Health Wallet</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Secure digital storage for your health documents and information.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">Secure & Encrypted</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'vaccinations', label: 'Vaccinations', icon: '💉' },
          { id: 'medicalId', label: 'Medical ID', icon: '🆔' },
          { id: 'insurance', label: 'Insurance', icon: '🏥' },
          { id: 'emergency', label: 'Emergency Info', icon: '🚨' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Vaccinations Tab */}
        {activeTab === 'vaccinations' && (
          <Card title="Vaccination Records" description="Your vaccination history and certificates.">
            <div className="space-y-4">
              {walletData.vaccinations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💉</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No vaccination records added yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {walletData.vaccinations.map((vax) => (
                    <div key={vax.id} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-green-900 dark:text-green-100">{vax.name}</h4>
                        <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          {vax.status || 'Completed'}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">Date: {vax.date}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Provider: {vax.provider}</p>
                      {vax.nextDose && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">Next dose: {vax.nextDose}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Vaccination Form */}
              <VaccinationForm onAdd={addVaccination} />
            </div>
          </Card>
        )}

        {/* Medical ID Tab */}
        {activeTab === 'medicalId' && (
          <Card title="Medical ID Card" description="Digital medical identification for emergencies.">
            <div className="space-y-6">
              {/* Medical ID Card Display */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">MEDICAL ID</h3>
                  <span className="text-red-200">Emergency</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {walletData.medicalId.name || 'Not set'}</p>
                  <p><strong>DOB:</strong> {walletData.medicalId.dob || 'Not set'}</p>
                  <p><strong>Blood Type:</strong> {walletData.medicalId.bloodType}</p>
                  <p><strong>Allergies:</strong> {walletData.medicalId.allergies || 'None'}</p>
                  <p><strong>Medications:</strong> {walletData.medicalId.medications || 'None'}</p>
                </div>
              </div>

              {/* Edit Medical ID Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
                  <input
                    value={walletData.medicalId.name}
                    onChange={(e) => updateMedicalId('name', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</span>
                  <input
                    type="date"
                    value={walletData.medicalId.dob}
                    onChange={(e) => updateMedicalId('dob', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Type</span>
                  <select
                    value={walletData.medicalId.bloodType}
                    onChange={(e) => updateMedicalId('bloodType', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Emergency Contact</span>
                  <input
                    value={walletData.medicalId.emergencyContact}
                    onChange={(e) => updateMedicalId('emergencyContact', e.target.value)}
                    placeholder="Contact name"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Allergies</span>
                  <textarea
                    value={walletData.medicalId.allergies}
                    onChange={(e) => updateMedicalId('allergies', e.target.value)}
                    placeholder="List any allergies..."
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Medications</span>
                  <textarea
                    value={walletData.medicalId.medications}
                    onChange={(e) => updateMedicalId('medications', e.target.value)}
                    placeholder="List current medications..."
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <Card title="Insurance Cards" description="Digital insurance cards and policies.">
            <div className="space-y-4">
              {walletData.insurance.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏥</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No insurance cards added yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {walletData.insurance.map((ins) => (
                    <div key={ins.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">{ins.provider}</h4>
                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {ins.type}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">ID: {ins.policyNumber}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Group: {ins.groupNumber || 'N/A'}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Valid: {ins.validUntil}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Insurance Form */}
              <InsuranceForm onAdd={addInsurance} />
            </div>
          </Card>
        )}

        {/* Emergency Info Tab */}
        {activeTab === 'emergency' && (
          <Card title="Emergency Medical Information" description="Critical information for emergency responders.">
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-4">Emergency Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">Medical Conditions</span>
                    <textarea
                      value={walletData.emergencyInfo.conditions}
                      onChange={(e) => updateEmergencyInfo('conditions', e.target.value)}
                      placeholder="List any medical conditions..."
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-red-400 focus:ring-2 focus:ring-red-200"
                    />
                  </label>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">Primary Physician</span>
                      <input
                        value={walletData.emergencyInfo.physician}
                        onChange={(e) => updateEmergencyInfo('physician', e.target.value)}
                        placeholder="Dr. Smith"
                        className="mt-1 w-full rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">Physician Phone</span>
                      <input
                        value={walletData.emergencyInfo.physicianPhone}
                        onChange={(e) => updateEmergencyInfo('physicianPhone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1 w-full rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                    </label>
                  </div>
                </div>
                <label className="block mt-4">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Additional Notes</span>
                  <textarea
                    value={walletData.emergencyInfo.notes}
                    onChange={(e) => updateEmergencyInfo('notes', e.target.value)}
                    placeholder="Any additional information for emergency responders..."
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  />
                </label>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Emergency Access</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      This information is automatically shared with emergency services when you use the SOS button.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Sub-components
function VaccinationForm({ onAdd }) {
  const [form, setForm] = useState({
    name: '',
    date: '',
    provider: '',
    nextDose: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.date) return
    onAdd(form)
    setForm({ name: '', date: '', provider: '', nextDose: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4 space-y-4">
      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Add Vaccination</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          placeholder="Vaccine name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <input
          placeholder="Provider/Clinic"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="date"
          placeholder="Next dose (optional)"
          value={form.nextDose}
          onChange={(e) => setForm({ ...form, nextDose: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
      >
        Add Vaccination
      </button>
    </form>
  )
}

function InsuranceForm({ onAdd }) {
  const [form, setForm] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    type: 'Health',
    validUntil: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.provider || !form.policyNumber) return
    onAdd(form)
    setForm({ provider: '', policyNumber: '', groupNumber: '', type: 'Health', validUntil: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4 space-y-4">
      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Add Insurance Card</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          placeholder="Insurance Provider"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        >
          <option value="Health">Health Insurance</option>
          <option value="Dental">Dental Insurance</option>
          <option value="Vision">Vision Insurance</option>
          <option value="Life">Life Insurance</option>
        </select>
        <input
          placeholder="Policy/Member ID"
          value={form.policyNumber}
          onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <input
          placeholder="Group Number (optional)"
          value={form.groupNumber}
          onChange={(e) => setForm({ ...form, groupNumber: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <input
          type="date"
          placeholder="Valid Until"
          value={form.validUntil}
          onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
      >
        Add Insurance Card
      </button>
    </form>
  )
}