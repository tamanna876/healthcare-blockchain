import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-5xl font-semibold text-slate-900">404</h1>
      <p className="text-lg text-slate-600">We couldn't find the page you're looking for.</p>
      <Link
        to="/dashboard"
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
      >
        Go back to dashboard
      </Link>
    </div>
  )
}
