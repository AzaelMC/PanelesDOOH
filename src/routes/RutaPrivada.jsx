import { Navigate, Outlet, useLocation } from 'react-router-dom'
import DisenoAplicacion from '../components/layout/DisenoAplicacion'
import { useAutenticacion } from '../features/autenticacion/context/useAutenticacion'

function PantallaCargaPrivada() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[32px] border border-white/70 bg-white/90 px-8 py-10 text-center shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Validando sesion
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Preparando el entorno administrativo de DOOH Maps.
        </p>
      </div>
    </main>
  )
}

export default function RutaPrivada({ children, rolesPermitidos }) {
  const location = useLocation()
  const { autenticado, cargandoSesion, usuario } = useAutenticacion()

  if (cargandoSesion) {
    return <PantallaCargaPrivada />
  }

  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (rolesPermitidos?.length && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/panel" replace />
  }

  return (
    <DisenoAplicacion>
      {children || <Outlet />}
    </DisenoAplicacion>
  )
}
