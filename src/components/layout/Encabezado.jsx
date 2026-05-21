import { NavLink, useNavigate } from 'react-router-dom'
import Boton from '../ui/Boton'
import { useAutenticacion } from '../../features/autenticacion/context/useAutenticacion'

const enlaces = [
  { to: '/panel', label: 'Panel' },
  { to: '/cotizaciones/nueva', label: 'Nueva cotizacion' },
  { to: '/cotizaciones/historial', label: 'Historial' },
  { to: '/usuarios', label: 'Usuarios' }
]

function linkClasses({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-slate-950 text-white'
      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
  }`
}

export default function Encabezado() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAutenticacion()

  const handleCerrarSesion = async () => {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-slate-50/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-sm font-semibold uppercase tracking-[0.25em] text-white">
            DM
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              NTP Media
            </p>
            <h1 className="text-xl font-semibold text-slate-950">DOOH Maps</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:items-end">
          <nav className="flex flex-wrap items-center gap-2">
            {enlaces.map((enlace) => (
              <NavLink key={enlace.to} to={enlace.to} className={linkClasses}>
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2">
              <span className="font-semibold text-slate-900">{usuario?.nombre || 'Sesion activa'}</span>
              <span className="ml-2 text-slate-500">
                {usuario?.rol ? `· ${usuario.rol}` : ''}
              </span>
            </div>
            <Boton variant="secondary" size="sm" onClick={handleCerrarSesion}>
              Cerrar sesion
            </Boton>
          </div>
        </div>
      </div>
    </header>
  )
}
