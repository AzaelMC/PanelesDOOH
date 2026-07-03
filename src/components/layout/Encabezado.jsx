import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Boton from '../ui/Boton'
import { useAutenticacion } from '../../features/autenticacion/context/useAutenticacion'

const enlaces = [
  { to: '/panel', label: 'Panel' },
  { to: '/cotizaciones/nueva', label: 'Nueva cotizacion' },
  { to: '/cotizaciones/historial', label: 'Historial' },
  { to: '/usuarios', label: 'Usuarios', soloAdministrador: true }
]

const NTP_ICON_SRC = `${import.meta.env.BASE_URL}brand/ntp-icon.png`

function menuLinkClasses({ isActive }) {
  return `rounded-full px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_-28px_rgba(39,11,43,0.72)] transition ${
    isActive
      ? 'ntp-nav-pill-active'
      : 'ntp-nav-pill bg-white/88 hover:bg-white'
  }`
}

function IconoRegresar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 10H5" />
      <path d="M9 14 5 10l4-4" />
    </svg>
  )
}

export default function Encabezado() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAutenticacion()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 })
  const mostrarBotonRegreso = location.pathname !== '/panel'
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)

  const enlacesVisibles = enlaces.filter((enlace) => (
    !enlace.soloAdministrador || usuario?.rol === 'administrador'
  ))

  useEffect(() => {
    if (!menuAbierto) {
      return undefined
    }

    const updateMenuPosition = () => {
      const triggerRect = menuButtonRef.current?.getBoundingClientRect()

      if (!triggerRect) {
        return
      }

      setMenuPosition({
        top: Math.round(triggerRect.bottom + 12),
        right: Math.max(16, Math.round(window.innerWidth - triggerRect.right))
      })
    }

    const handlePointerDown = (event) => {
      const target = event.target

      if (
        menuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return
      }

      setMenuAbierto(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuAbierto(false)
      }
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuAbierto])

  const handleCerrarSesion = async () => {
    setMenuAbierto(false)
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  const handleRegresar = () => {
    setMenuAbierto(false)

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/panel')
  }

  const handleMenuNavigation = (to) => {
    setMenuAbierto(false)
    navigate(to)
  }

  const menuFlotante = menuAbierto && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        id="ntp-menu-principal"
        className="fixed flex w-[250px] flex-col gap-2 rounded-[24px] border border-white/80 bg-white/95 p-3 shadow-[0_26px_70px_-34px_rgba(39,11,43,0.72)] backdrop-blur-[18px]"
        style={{
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`,
          zIndex: 9999
        }}
      >
        {enlacesVisibles.map((enlace) => (
          <button
            key={enlace.to}
            type="button"
            className={menuLinkClasses({ isActive: location.pathname === enlace.to })}
            onClick={() => handleMenuNavigation(enlace.to)}
          >
            {enlace.label}
          </button>
        ))}
      </div>,
      document.body
    )
    : null

  return (
    <>
      <header className="ntp-headbar sticky top-0 z-50">
        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {mostrarBotonRegreso && (
              <button
                type="button"
                aria-label="Regresar a la pantalla anterior"
                className="flex h-12 items-center gap-2 rounded-2xl border border-white/75 bg-white/78 px-3 text-sm font-semibold text-[var(--ntp-purple-brand)] shadow-[0_14px_34px_-24px_rgba(65,17,137,0.48)] transition hover:bg-white"
                onClick={handleRegresar}
              >
                <IconoRegresar />
                <span className="hidden sm:inline">Regresar</span>
              </button>
            )}

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

          <div className="relative flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-full border border-white/75 bg-white/72 px-4 py-2 text-sm text-[var(--ntp-nav-text)] shadow-[0_14px_34px_-24px_rgba(65,17,137,0.48)] backdrop-blur-[18px] sm:flex">
              <span className="font-semibold text-[var(--ntp-ink)]">{usuario?.nombre || 'Sesion activa'}</span>
              {usuario?.rol && (
                <>
                  <span className="mx-2 text-[var(--ntp-muted)]">&middot;</span>
                  <span className="text-[var(--ntp-muted)]">{usuario.rol}</span>
                </>
              )}
            </div>

            <Boton
              variant="brandSecondary"
              size="sm"
              onClick={handleCerrarSesion}
              className="border-white/75 bg-white/78 px-4 shadow-[0_14px_34px_-24px_rgba(65,17,137,0.48)]"
            >
              Cerrar sesion
            </Boton>

            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuAbierto ? 'Cerrar menu principal' : 'Abrir menu principal'}
              aria-controls="ntp-menu-principal"
              aria-expanded={menuAbierto}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/75 bg-white/78 text-[var(--ntp-purple-brand)] shadow-[0_14px_34px_-24px_rgba(65,17,137,0.48)] transition hover:bg-white"
              onClick={() => setMenuAbierto((prev) => !prev)}
            >
              <span
                className={`absolute h-[3px] w-6 rounded-full bg-current transition duration-200 ${
                  menuAbierto ? 'translate-y-0 rotate-45' : '-translate-y-[7px]'
                }`}
              />
              <span
                className={`absolute h-[3px] w-6 rounded-full bg-current transition duration-200 ${
                  menuAbierto ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute h-[3px] w-6 rounded-full bg-current transition duration-200 ${
                  menuAbierto ? 'translate-y-0 -rotate-45' : 'translate-y-[7px]'
                }`}
              />
            </button>

            {menuFlotante}
          </div>
        </div>
      </header>
    </>
  )
}
