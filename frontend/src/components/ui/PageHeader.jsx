import { Link } from 'react-router-dom'

export default function PageHeader({ title, subtitle, action, breadcrumbs }) {
  return (
    <div className="brand-glass relative overflow-hidden rounded-[32px] p-6">
      <div className="brand-orb brand-orb-cyan -right-12 -top-16 h-40 w-40" />
      <div className="brand-orb brand-orb-indigo left-1/3 top-0 h-28 w-28" />
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {action ? <div className="flex items-center">{action}</div> : null}
      </div>
      {breadcrumbs ? (
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="inline-flex items-center gap-1">
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-slate-900">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? <span>/</span> : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
