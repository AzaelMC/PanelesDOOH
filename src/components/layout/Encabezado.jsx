import { NavLink, useNavigate } from 'react-router-dom'
import Boton from '../ui/Boton'
import { useAutenticacion } from '../../features/autenticacion/context/useAutenticacion'

const enlaces = [
  { to: '/panel', label: 'Panel' },
  { to: '/cotizaciones/nueva', label: 'Nueva cotizacion' },
  { to: '/cotizaciones/historial', label: 'Historial' },
  { to: '/usuarios', label: 'Usuarios', soloAdministrador: true }
]

const NTP_ICON_SRC = `${import.meta.env.BASE_URL}brand/ntp-icon.png`

function linkClasses({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'ntp-nav-pill-active'
      : 'ntp-nav-pill'
  }`
}

export default function Encabezado() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAutenticacion()

  const enlacesVisibles = enlaces.filter((enlace) => (
    !enlace.soloAdministrador || usuario?.rol === 'administrador'
  ))

  const handleCerrarSesion = async () => {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <header className="ntp-headbar sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="ntp-brand-mark flex h-14 w-14 items-center justify-center rounded-3xl p-3">
            <img
              src={NTP_ICON_SRC}
              alt="NTP Media"
              className="max-h-full max-w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
                event.currentTarget.nextElementSibling.style.display = 'inline-flex'
              }}
            />
            <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--ntp-purple-brand)]">
              NTP
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ntp-nav-text)]">
              NTP Media
            </p>
            <h1 className="ntp-page-title text-xl">DOOH Maps</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:items-end">
          <nav className="flex flex-wrap items-center gap-2">
            {enlacesVisibles.map((enlace) => (
              <NavLink key={enlace.to} to={enlace.to} className={linkClasses}>
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ntp-nav-text)]">
            <div className="ntp-soft-panel rounded-full px-4 py-2">
              <span className="font-semibold text-[var(--ntp-ink)]">{usuario?.nombre || 'Sesion activa'}</span>
              <span className="ml-2 text-[var(--ntp-muted)]">
                {usuario?.rol ? `· ${usuario.rol}` : ''}
              </span>
            </div>
            <Boton variant="brandSecondary" size="sm" onClick={handleCerrarSesion}>
              Cerrar sesion
            </Boton>
          </div>
        </div>
      </div>
    </header>
  )
}
