export default function CampoTexto({
  as = 'input',
  id,
  name,
  type = 'text',
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  children,
  ...props
}) {
  const Component = as
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-') || undefined
  const baseClasses =
    'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-200'

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <Component
        id={inputId}
        name={name}
        type={Component === 'input' ? type : undefined}
        rows={Component === 'textarea' ? rows : undefined}
        className={`${baseClasses} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
        {...props}
      >
        {children}
      </Component>
      {helperText && !error && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
