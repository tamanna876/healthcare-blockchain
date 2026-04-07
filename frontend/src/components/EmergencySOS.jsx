import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { createEmergencySos, getMedicalRecords } from '../services/api.js'

export default function EmergencySOS() {
  const { email, role } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [emergencyContacts] = useState([
    { name: 'Emergency Services', number: '911', type: 'emergency' },
    { name: 'Ambulance Service', number: '911', type: 'ambulance' },
    { name: 'Poison Control', number: '1-800-222-1222', type: 'poison' },
    { name: 'Primary Care', number: '(555) 123-4567', type: 'doctor' }
  ])
  const [userLocation, setUserLocation] = useState(null)
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: 'Unknown',
    allergies: 'None known',
    medications: 'See prescription records',
    conditions: 'See medical records'
  })
  const [sendingAlert, setSendingAlert] = useState(false)
  const [lastSosResult, setLastSosResult] = useState(null)

  useEffect(() => {
    async function loadMedicalInfo() {
      if (role === 'Patient') {
        const records = await getMedicalRecords(email)
        if (records.length > 0) {
          const latestRecord = records[0]
          setMedicalInfo({
            bloodType: 'A+',
            allergies: 'Penicillin',
            medications: 'See prescription records',
            conditions: latestRecord.diagnosis || 'See medical records',
          })
        }
      }
    }

    // Get user's location for emergency services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }

    loadMedicalInfo()
  }, [email, role])

  const handleEmergencyCall = (number) => {
    window.open(`tel:${number}`)
  }

  const sendEmergencyAlert = async () => {
    setSendingAlert(true)
    try {
      const payload = {
        message: `Emergency alert from ${email || 'patient'}: immediate assistance required`,
        type: 'blood',
        urgency: 'critical',
        location: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'location unavailable',
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
      }
      const response = await createEmergencySos(payload)
      setLastSosResult(response)
      alert('Emergency alert sent. Nearby donors and escalation ladder notified.')
      handleEmergencyCall('911')
    } catch (error) {
      alert(`Unable to send SOS: ${error.message}`)
    } finally {
      setSendingAlert(false)
    }
  }

  // Only show for patients and doctors
  if (role !== 'Patient' && role !== 'Doctor') {
    return null
  }

  return (
    <>
      {/* Main SOS Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-24 right-6 z-40 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse"
        title="Emergency SOS - Tap for help"
      >
        <span className="text-2xl">🚨</span>
      </button>

      {/* Expanded Emergency Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-30"
            onClick={() => setIsExpanded(false)}
          />

          {/* Emergency Panel */}
          <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border-4 border-red-500 overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">🚨</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">EMERGENCY SOS</h3>
                    <p className="text-sm opacity-90">Get help immediately</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
            </div>

            {/* Emergency Actions */}
            <div className="p-4 space-y-3">
              {/* Main Emergency Button */}
              <button
                onClick={sendEmergencyAlert}
                disabled={sendingAlert}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🚨</span>
                {sendingAlert ? 'SENDING SOS...' : 'CALL EMERGENCY SERVICES'}
              </button>

              {lastSosResult && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Escalation: {(lastSosResult.escalationNotified || []).join(' -> ') || 'none'}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleEmergencyCall('911')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 py-3 px-4 rounded-lg font-semibold transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-lg">📞</span>
                  <span className="text-sm">Call 911</span>
                </button>

                <button
                  onClick={() => handleEmergencyCall('911')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 py-3 px-4 rounded-lg font-semibold transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-lg">🚑</span>
                  <span className="text-sm">Ambulance</span>
                </button>
              </div>

              {/* Emergency Contacts */}
              <div className="border-t pt-3">
                <h4 className="font-semibold text-gray-800 mb-2">Emergency Contacts</h4>
                <div className="space-y-2">
                  {emergencyContacts.map((contact, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmergencyCall(contact.number)}
                      className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {contact.type === 'emergency' ? '🚨' :
                           contact.type === 'poison' ? '☠️' : '👨‍⚕️'}
                        </span>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.number}</p>
                        </div>
                      </div>
                      <span className="text-gray-400">📞</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical Info Summary */}
              <div className="border-t pt-3">
                <h4 className="font-semibold text-gray-800 mb-2">Quick Medical Info</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <p><strong>Blood Type:</strong> {medicalInfo.bloodType}</p>
                  <p><strong>Allergies:</strong> {medicalInfo.allergies}</p>
                  <p><strong>Conditions:</strong> {medicalInfo.conditions}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Full medical records available in your profile
                  </p>
                </div>
              </div>

              {lastSosResult?.nearbyDonors?.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-gray-800 mb-2">Nearby Donor Confidence Map</h4>
                  <div className="space-y-2 max-h-44 overflow-auto">
                    {lastSosResult.nearbyDonors.map((donor) => (
                      <div key={donor.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-800">{donor.name}</span>
                          <span className="text-gray-600">{donor.distanceKm} km</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.max(8, donor.confidenceScore || 0)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-600">Confidence score: {donor.confidenceScore || 0}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 text-center">
                  ⚠️ Use only in real emergencies. False alarms may have consequences.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}