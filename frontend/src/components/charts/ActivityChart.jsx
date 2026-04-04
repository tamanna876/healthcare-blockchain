import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const sampleData = [
  { day: 'Mon', records: 20, donations: 12, trials: 3 },
  { day: 'Tue', records: 28, donations: 18, trials: 5 },
  { day: 'Wed', records: 35, donations: 22, trials: 8 },
  { day: 'Thu', records: 32, donations: 24, trials: 7 },
  { day: 'Fri', records: 40, donations: 30, trials: 9 },
  { day: 'Sat', records: 38, donations: 26, trials: 6 },
  { day: 'Sun', records: 22, donations: 16, trials: 4 },
]

export default function ActivityChart({ data = sampleData }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1A9AFF" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#1A9AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="records"
            stroke="#1A9AFF"
            fill="url(#colorRecords)"
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="donations"
            stroke="#10B981"
            fill="url(#colorDonations)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
