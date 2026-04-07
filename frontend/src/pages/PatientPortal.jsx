import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getMedicalRecords, getBloodDonors, getOrganDonors, getAppointments, saveAppointment, getPrescriptions, requestPrescriptionRefill } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  HeartIcon,
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  DocumentTextIcon,
  BeakerIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

export default function PatientPortal() {
  const { role, email, walletAddress } = useAuth()
  const didNotifyAuthError = useRef(false)
  const didNotifyDemoMode = useRef(false)
  const [records, setRecords] = useState([])
  const [bloodDonations, setBloodDonations] = useState([])
  const [organDonations, setOrganDonations] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [appointmentForm, setAppointmentForm] = useState({
    doctor: 'Dr. Sarah Johnson, MD',
    specialty: 'Cardiology',
    date: '',
    time: '',
    reason: '',
    type: 'consultation'
  })
  const [refillForm, setRefillForm] = useState({
    medication: '',
    dosage: '',
    pharmacy: 'CVS Pharmacy',
    quantity: 30
  })
  const [medicationReminders, setMedicationReminders] = useState([])
  const [reminderForm, setReminderForm] = useState({
    medication: '',
    dosage: '',
    time: '',
    frequency: 'daily',
    notes: '',
    startDate: new Date().toISOString().split('T')[0]
  })
  const [healthMetrics, setHealthMetrics] = useState({
    weight: '',
    height: '',
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    temperature: '',
    bloodSugar: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [healthHistory, setHealthHistory] = useState([])
  const [bmiResult, setBmiResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const demoRecords = [
        {
          id: 1,
          diagnosis: 'General Wellness Checkup',
          treatment: 'Vitals normal, advised hydration and light exercise',
          date: '2026-03-12',
          doctor: 'Dr. Mehta'
        },
        {
          id: 2,
          diagnosis: 'Seasonal Allergy Review',
          treatment: 'Antihistamine prescribed for 7 days',
          date: '2026-02-04',
          doctor: 'Dr. Khan'
        }
      ]

      const demoBloodDonations = [
        { id: 'bd-demo-1', bloodGroup: 'O+', location: 'City Blood Bank', registeredAt: '2026-01-18' },
        { id: 'bd-demo-2', bloodGroup: 'A+', location: 'Metro Health Center', registeredAt: '2025-11-27' },
      ]

      const demoOrganDonations = [
        { id: 'od-demo-1', organType: 'Kidney', location: 'Care Hospital', registeredAt: '2025-10-10' },
      ]

      const demoAppointments = [
        { id: 'apt-demo-1', patientEmail: email, doctor: 'Dr. Rao', date: '2026-04-12', time: '11:30', status: 'Scheduled' },
      ]

      const demoPrescriptions = [
        { id: 'rx-demo-1', patientEmail: email, medication: 'Cetirizine', dosage: '10mg', pharmacy: 'City Pharmacy', status: 'Active' },
      ]

      try {
        const patientAddress = walletAddress
        if (!patientAddress) {
          setRecords(demoRecords)
        } else {
          const medicalData = await getMedicalRecords(patientAddress)
          if (medicalData.length === 0) {
            setRecords(demoRecords)
          } else {
            const transformed = medicalData.map((record, index) => ({
              id: index + 1,
              diagnosis: `Medical Record ${index + 1}`,
              treatment: `IPFS Hash: ${record.ipfsHash.substring(0, 20)}...`,
              date: new Date(Number(record.timestamp) * 1000).toISOString().split('T')[0],
              doctor: `${record.doctor.substring(0, 10)}...`
            }))
            setRecords(transformed)
          }
        }
      } catch (error) {
        if (String(error?.message || '').includes('401') || String(error?.message || '').includes('Not authorised')) {
          setRecords([])
          if (!didNotifyAuthError.current) {
            didNotifyAuthError.current = true
            toast.error('Session expired. Please login again.')
          }
          setLoading(false)
          return
        } else {
          setRecords(demoRecords)
          if (!didNotifyDemoMode.current) {
            didNotifyDemoMode.current = true
            toast('Demo mode active for portal data', { icon: 'ℹ️' })
          }
        }
      }

      try {
        const [bloodData, organData, appointmentData, prescriptionData] = await Promise.all([
          getBloodDonors(),
          getOrganDonors(),
          getAppointments(),
          getPrescriptions(),
        ])

        setBloodDonations(bloodData)
        setOrganDonations(organData)
        setAppointments(appointmentData.filter((a) => a.patientEmail === email))
        setPrescriptions(prescriptionData.filter((p) => p.patientEmail === email))
      } catch (error) {
        if (String(error?.message || '').includes('401') || String(error?.message || '').includes('Not authorised')) {
          if (!didNotifyAuthError.current) {
            didNotifyAuthError.current = true
            toast.error('Session expired. Please login again.')
          }
          setLoading(false)
          return
        } else {
          setBloodDonations(demoBloodDonations)
          setOrganDonations(demoOrganDonations)
          setAppointments(demoAppointments)
          setPrescriptions(demoPrescriptions)
          if (!didNotifyDemoMode.current) {
            didNotifyDemoMode.current = true
            toast('Demo mode active for portal data', { icon: 'ℹ️' })
          }
        }
      }

      const savedReminders = localStorage.getItem(`medicationReminders_${email}`)
      if (savedReminders) {
        setMedicationReminders(JSON.parse(savedReminders))
      }

      const savedHealthHistory = localStorage.getItem(`healthHistory_${email}`)
      if (savedHealthHistory) {
        setHealthHistory(JSON.parse(savedHealthHistory))
      }

      setLoading(false)
    }
    fetchData()
  }, [email, walletAddress])

  if (role !== 'Patient') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          The Patient Portal is only available to Patient users.
        </p>
      </div>
    )
  }

  const healthTips = [
    'Stay hydrated by drinking at least 8 glasses of water daily.',
    'Exercise regularly for at least 30 minutes most days of the week.',
    'Eat a balanced diet rich in fruits, vegetables, and whole grains.',
    'Get 7-9 hours of quality sleep each night.',
    'Schedule regular check-ups with your healthcare provider.',
  ]

  const handleBookAppointment = async (event) => {
    event.preventDefault()
    if (!appointmentForm.date || !appointmentForm.time) {
      toast.error('Please select a date and time for your appointment.')
      return
    }

    const record = await saveAppointment({
      doctor: appointmentForm.doctor,
      date: appointmentForm.date,
      time: appointmentForm.time,
      reason: appointmentForm.reason,
    })

    setAppointments((prev) => [record, ...prev])
    toast.success('Appointment booked successfully')
    setAppointmentForm({ ...appointmentForm, date: '', time: '' })
  }

  const handleRequestRefill = async (event) => {
    event.preventDefault()
    if (!refillForm.medication || !refillForm.dosage || !refillForm.pharmacy) {
      toast.error('Please fill in all refill request fields.')
      return
    }

    const record = await requestPrescriptionRefill({
      medication: refillForm.medication,
      dosage: refillForm.dosage,
      pharmacy: refillForm.pharmacy,
      frequency: 'As prescribed',
    })

    setPrescriptions((prev) => [record, ...prev])
    toast.success('Refill request submitted')
    setRefillForm({ medication: '', dosage: '', pharmacy: '' })
  }

  const handleAddReminder = (event) => {
    event.preventDefault()
    if (!reminderForm.medication || !reminderForm.time) {
      toast.error('Please fill in medication name and time.')
      return
    }

    const nextReminderId = medicationReminders.length > 0
      ? Math.max(...medicationReminders.map((reminder) => Number(reminder.id) || 0)) + 1
      : 1

    const newReminder = {
      id: nextReminderId,
      ...reminderForm,
      createdAt: new Date().toISOString(),
      enabled: true
    }

    const updatedReminders = [...medicationReminders, newReminder]
    setMedicationReminders(updatedReminders)
    localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(updatedReminders))

    // Request notification permission and schedule notification
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          scheduleNotification(newReminder)
        }
      })
    }

    toast.success('Medication reminder added successfully')
    setReminderForm({
      medication: '',
      dosage: '',
      time: '',
      frequency: 'daily',
      notes: ''
    })
  }

  const scheduleNotification = (reminder) => {
    const [hours, minutes] = reminder.time.split(':')
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1) // Schedule for tomorrow if time has passed
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(() => {
      new Notification(`Medication Reminder: ${reminder.medication}`, {
        body: `Time to take ${reminder.dosage || 'your medication'}. ${reminder.notes || ''}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }, timeUntilReminder)
  }

  const toggleReminder = (id) => {
    const updatedReminders = medicationReminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    )
    setMedicationReminders(updatedReminders)
    localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(updatedReminders))
  }

  const deleteReminder = (id) => {
    const updatedReminders = medicationReminders.filter(reminder => reminder.id !== id)
    setMedicationReminders(updatedReminders)
    localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(updatedReminders))
    toast.success('Reminder deleted')
  }

  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const heightInMeters = height / 100
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1)
      return {
        value: parseFloat(bmi),
        category: bmi < 18.5 ? 'Underweight' :
                 bmi < 25 ? 'Normal' :
                 bmi < 30 ? 'Overweight' : 'Obese'
      }
    }
    return null
  }

  const handleAddHealthMetrics = (event) => {
    event.preventDefault()
    if (!healthMetrics.weight || !healthMetrics.height) {
      toast.error('Please enter weight and height for BMI calculation.')
      return
    }

    const bmi = calculateBMI(parseFloat(healthMetrics.weight), parseFloat(healthMetrics.height))
    const newEntry = {
      id: Date.now(),
      ...healthMetrics,
      bmi: bmi,
      recordedAt: new Date().toISOString()
    }

    const updatedHistory = [newEntry, ...healthHistory]
    setHealthHistory(updatedHistory)
    localStorage.setItem(`healthHistory_${email}`, JSON.stringify(updatedHistory))

    setBmiResult(bmi)
    toast.success('Health metrics recorded successfully')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Portal"
        subtitle="Access your personal health information and resources."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Patient Portal' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="My Medical Records" description="View your blockchain-secured medical history.">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
            </div>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-500">No medical records found. Records will appear here when added by your healthcare provider.</p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{record.diagnosis}</p>
                      <p className="text-sm text-slate-600">{record.treatment}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(record.date).toLocaleDateString()} • Dr. {record.doctor}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Health Dashboard" description="Your health summary and quick stats.">
          <div className="grid gap-4">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Total Records</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{records.length}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">Last Visit</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {records.length > 0 ? new Date(records[0].date).toLocaleDateString() : 'No visits yet'}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm font-medium text-purple-700">Health Status</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Good</p>
            </div>
          </div>
        </Card>

        <Card title="Donation History" description="Your blood and organ donation records.">
          <div className="space-y-4">
            {bloodDonations.length === 0 && organDonations.length === 0 ? (
              <p className="text-sm text-slate-500">No donation records found. Consider donating to help others!</p>
            ) : (
              <>
                {bloodDonations.slice(0, 2).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                    <div>
                      <p className="font-medium text-red-900">Blood Donation</p>
                      <p className="text-sm text-red-700">{donation.bloodGroup} • {donation.location}</p>
                      <p className="text-xs text-red-600">{new Date(donation.registeredAt).toLocaleDateString()}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      🩸
                    </div>
                  </div>
                ))}
                {organDonations.slice(0, 2).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div>
                      <p className="font-medium text-blue-900">Organ Donation</p>
                      <p className="text-sm text-blue-700">{donation.organType} • {donation.location}</p>
                      <p className="text-xs text-blue-600">{new Date(donation.registeredAt).toLocaleDateString()}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      🫀
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Health Tips" description="Daily tips for maintaining good health.">
          <div className="space-y-3">
            {healthTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-600">{tip}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Emergency Contacts" description="Important contacts for emergencies.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-900">Emergency Services</p>
                <p className="text-sm text-slate-600">Call 911 for immediate help</p>
              </div>
              <button className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                Call
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-900">Primary Care Doctor</p>
                <p className="text-sm text-slate-600">Dr. Smith - (555) 123-4567</p>
              </div>
              <button className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                Call
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-900">Family Contact</p>
                <p className="text-sm text-slate-600">Emergency contact</p>
              </div>
              <button className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-white">
                Call
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Book an appointment" description="Schedule a visit with your healthcare provider.">
          <form className="space-y-4" onSubmit={handleBookAppointment}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Doctor</span>
              <select
                value={appointmentForm.doctor}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              >
                <option>Dr. Khan</option>
                <option>Dr. Patel</option>
                <option>Dr. Rao</option>
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Time</span>
                <input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Book appointment
            </button>
          </form>

          {appointments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No upcoming appointments yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {appointments.slice(0, 3).map((appt) => (
                <div key={appt.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-medium text-slate-900">{appt.doctor}</p>
                  <p className="text-sm text-slate-600">
                    {appt.date} at {appt.time}
                  </p>
                  <p className="text-xs text-slate-500">Status: {appt.status}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Prescription refills" description="Request a refill from your pharmacy.">
          <form className="space-y-4" onSubmit={handleRequestRefill}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Medication</span>
              <input
                value={refillForm.medication}
                onChange={(e) => setRefillForm({ ...refillForm, medication: e.target.value })}
                placeholder="Medication name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Dosage</span>
              <input
                value={refillForm.dosage}
                onChange={(e) => setRefillForm({ ...refillForm, dosage: e.target.value })}
                placeholder="e.g. 2 pills daily"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Preferred pharmacy</span>
              <input
                value={refillForm.pharmacy}
                onChange={(e) => setRefillForm({ ...refillForm, pharmacy: e.target.value })}
                placeholder="Pharmacy name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Request refill
            </button>
          </form>

          {prescriptions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No refill requests yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {prescriptions.slice(0, 3).map((rx) => (
                <div key={rx.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-medium text-slate-900">{rx.medication}</p>
                  <p className="text-sm text-slate-600">{rx.dosage} • {rx.pharmacy}</p>
                  <p className="text-xs text-slate-500">Status: {rx.status}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Medication Reminders" description="Set and manage your medication schedule.">
        <div className="space-y-6">
          {/* Add New Reminder Form */}
          <form className="space-y-4" onSubmit={handleAddReminder}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Medication</span>
                <input
                  value={reminderForm.medication}
                  onChange={(e) => setReminderForm({ ...reminderForm, medication: e.target.value })}
                  placeholder="Medication name"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Dosage</span>
                <input
                  value={reminderForm.dosage}
                  onChange={(e) => setReminderForm({ ...reminderForm, dosage: e.target.value })}
                  placeholder="e.g. 1 tablet"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Time</span>
                <input
                  type="time"
                  value={reminderForm.time}
                  onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Frequency</span>
                <select
                  value={reminderForm.frequency}
                  onChange={(e) => setReminderForm({ ...reminderForm, frequency: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                >
                  <option value="daily">Daily</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Notes (Optional)</span>
                <input
                  value={reminderForm.notes}
                  onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                  placeholder="Additional instructions"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700"
            >
              ➕ Add Reminder
            </button>
          </form>

          {/* Existing Reminders */}
          {medicationReminders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💊</div>
              <p className="text-sm text-slate-500">No medication reminders set yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add your first reminder above to stay on track with your medications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Your Reminders</h4>
              {medicationReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${reminder.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">{reminder.medication}</p>
                      <p className="text-sm text-slate-600">
                        {reminder.dosage} • {reminder.time} • {reminder.frequency}
                        {reminder.notes && ` • ${reminder.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        reminder.enabled
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {reminder.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notification Permission Info */}
          {'Notification' in window && Notification.permission === 'default' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600">🔔</div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Enable Notifications</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Allow browser notifications to receive medication reminders even when the app is closed.
                  </p>
                  <button
                    onClick={() => Notification.requestPermission()}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                  >
                    Enable Notifications
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Health Analytics & Tracking" description="Monitor your health metrics and trends over time.">
        <div className="space-y-6">
          {/* BMI Calculator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">BMI Calculator</h4>
            <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleAddHealthMetrics}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={healthMetrics.weight}
                  onChange={(e) => setHealthMetrics({ ...healthMetrics, weight: e.target.value })}
                  placeholder="70.5"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</span>
                <input
                  type="number"
                  value={healthMetrics.height}
                  onChange={(e) => setHealthMetrics({ ...healthMetrics, height: e.target.value })}
                  placeholder="170"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
                >
                  Calculate BMI
                </button>
              </div>
            </form>

            {bmiResult && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      BMI: {bmiResult.value}
                    </p>
                    <p className={`text-sm font-medium ${
                      bmiResult.category === 'Normal' ? 'text-green-600' :
                      bmiResult.category === 'Underweight' ? 'text-yellow-600' :
                      bmiResult.category === 'Overweight' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      Category: {bmiResult.category}
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    bmiResult.category === 'Normal' ? 'bg-green-100 text-green-600' :
                    bmiResult.category === 'Underweight' ? 'bg-yellow-100 text-yellow-600' :
                    bmiResult.category === 'Overweight' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {bmiResult.category === 'Normal' ? '✅' :
                     bmiResult.category === 'Underweight' ? '⚠️' :
                     bmiResult.category === 'Overweight' ? '⚠️' : '❌'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Blood Pressure & Weight Tracking */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Blood Pressure Log</h4>
              <form className="space-y-4" onSubmit={handleAddHealthMetrics}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Systolic</span>
                    <input
                      type="number"
                      value={healthMetrics.systolicBP}
                      onChange={(e) => setHealthMetrics({ ...healthMetrics, systolicBP: e.target.value })}
                      placeholder="120"
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Diastolic</span>
                    <input
                      type="number"
                      value={healthMetrics.diastolicBP}
                      onChange={(e) => setHealthMetrics({ ...healthMetrics, diastolicBP: e.target.value })}
                      placeholder="80"
                      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</span>
                  <input
                    type="date"
                    value={healthMetrics.date}
                    onChange={(e) => setHealthMetrics({ ...healthMetrics, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
                >
                  Log Blood Pressure
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Weight Tracking</h4>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Weight</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {healthHistory.length > 0 ? `${healthHistory[0].weight} kg` : 'Not recorded'}
                  </span>
                </div>
                {healthHistory.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Previous</span>
                    <span className={`text-sm font-medium ${
                      parseFloat(healthHistory[0].weight) > parseFloat(healthHistory[1].weight)
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {healthHistory[1].weight} kg
                      {parseFloat(healthHistory[0].weight) !== parseFloat(healthHistory[1].weight) && (
                        <span className="ml-1">
                          ({parseFloat(healthHistory[0].weight) > parseFloat(healthHistory[1].weight) ? '↑' : '↓'}
                          {Math.abs(parseFloat(healthHistory[0].weight) - parseFloat(healthHistory[1].weight)).toFixed(1)} kg)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health History */}
          {healthHistory.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Health History</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {healthHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {entry.bmi ? entry.bmi.value : '--'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">BMI</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {entry.weight}kg
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Weight</p>
                      </div>
                      {entry.systolicBP && entry.diastolicBP && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {entry.systolicBP}/{entry.diastolicBP}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">BP</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(entry.recordedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(entry.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Quick Actions" description="Common tasks and resources.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center">
              📅
            </div>
            <span className="text-sm font-medium text-slate-900">Book Appointment</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              💊
            </div>
            <span className="text-sm font-medium text-slate-900">Refill Prescription</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              ⏰
            </div>
            <span className="text-sm font-medium text-slate-900">Medication Reminders</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              📋
            </div>
            <span className="text-sm font-medium text-slate-900">Lab Results</span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              📚
            </div>
            <span className="text-sm font-medium text-slate-900">Health Resources</span>
          </button>
        </div>
      </Card>
    </div>
  )
}
