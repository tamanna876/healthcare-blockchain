import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getBloodDonors, saveBloodDonor } from '../services/api.js'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function BloodDonation() {
  const [name, setName] = useState('')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [location, setLocation] = useState('')
  const [donors, setDonors] = useState([])
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDonors() {
      try {
        setDonors(await getBloodDonors())
      } finally {
        setLoading(false)
      }
    }

    loadDonors()
  }, [])

  const handleRegister = async (event) => {
    event.preventDefault()
    const record = await saveBloodDonor({ name, bloodGroup, location })
    setDonors((previous) => [record, ...previous])
    setNotice({ type: 'success', message: 'Donor registered successfully.' })
    toast.success('Blood donor registered')
    setName('')
    setLocation('')
  }

  const filterOptions = useMemo(
    () => [
      { label: 'All donors', value: '' },
      ...BLOOD_GROUPS.map((group) => ({ label: group, value: group })),
    ],
    [],
  )

  const [filter, setFilter] = useState('')
  const filteredDonors = useMemo(() => {
    if (!filter) return donors
    return donors.filter((donor) => donor.bloodGroup === filter)
  }, [donors, filter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Donation"
        subtitle="Register blood donors and search for compatible matches."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Blood Donation' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Register Donor" description="Add a new blood donor to the registry.">
          <form className="space-y-4" onSubmit={handleRegister}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Blood group</span>
              <select
                value={bloodGroup}
                onChange={(event) => setBloodGroup(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="City, State"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            {notice ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice.message}
              </div>
            ) : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
            >
              Register donor
            </button>
          </form>
        </Card>

        <Card title="Search Donors" description="Filter donors by blood group.">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Filter by blood group</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Blood group</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                        Loading donors...
                      </td>
                    </tr>
                  ) : filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                        No donors available.
                      </td>
                    </tr>
                  ) : (
                    filteredDonors.map((donor) => (
                      <tr key={donor.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{donor.name}</td>
                        <td className="px-4 py-3 text-slate-600">{donor.bloodGroup}</td>
                        <td className="px-4 py-3 text-slate-600">{donor.location}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(donor.registeredAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
