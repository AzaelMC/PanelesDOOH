export default function EtiquetaEstado({ children, status = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
    pending: 'bg-orange-100 text-orange-700',
    inactive: 'bg-slate-200 text-slate-600'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${variants[status]} ${className}`}
    >
      {children}
    </span>
  )
}
