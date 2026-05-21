export default function Boton({
  as = 'button',
  type = 'button',
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) {
  const Component = as
  const isNativeButton = Component === 'button'
  const isDisabled = disabled || loading

  const baseClasses =
    'inline-flex items-center justify-center rounded-full font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base'
  }

  const variants = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-900 disabled:bg-slate-300',
    secondary: 'bg-white text-slate-900 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
  }

  return (
    <Component
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      type={isNativeButton ? type : undefined}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? 'true' : undefined}
      onClick={isDisabled ? undefined : onClick}
      {...props}
    >
      {loading ? 'Procesando...' : children}
    </Component>
  )
}
