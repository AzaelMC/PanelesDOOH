export default function Tarjeta({ children, className = '' }) {
  return (
    <div
      className={`rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}
