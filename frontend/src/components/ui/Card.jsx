export default function Card({ title, description, footer, className = '', children }) {
  return (
    <section
      className={`brand-glass rounded-[28px] p-6 ${className}`}
    >
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
        </header>
      ) : null}
      <div className="space-y-4">{children}</div>
      {footer ? <div className="mt-6 text-sm text-slate-500">{footer}</div> : null}
    </section>
  )
}
