import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import FormularioLogin from '../components/FormularioLogin'
import { useAutenticacion } from '../context/useAutenticacion'
import { AUTH_MOCK_ENABLED } from '../../../config/env'

export default function PantallaLogin() {
  const { autenticado, cargandoSesion, iniciarSesion } = useAutenticacion()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (credentials) => {
    setError('')
    setLoading(true)

    try {
      await iniciarSesion(credentials)
    } catch (submitError) {
      setError(submitError.message || 'No fue posible iniciar sesion.')
    } finally {
      setLoading(false)
    }
  }

  if (cargandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[32px] border border-white/70 bg-white/90 px-8 py-10 text-center shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-slate-500">
            Cargando sesion
          </p>
        </div>
      </main>
    )
  }

  if (autenticado) {
    return <Navigate to="/panel" replace />
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_24%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
              NTP Media
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              DOOH Maps
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Plataforma administrativa para orquestar carga de cotizaciones, tratamiento de inventarios
              y validacion geografica de pantallas DOOH.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.30)]">
              <p className="text-sm font-semibold text-slate-900">Seguridad operacional</p>
              <p className="mt-2 text-sm text-slate-500">Acceso centralizado para equipos tecnico-comerciales.</p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.30)]">
              <p className="text-sm font-semibold text-slate-900">Pipeline administrado</p>
              <p className="mt-2 text-sm text-slate-500">Preparado para parser, tratamiento y exportacion posteriores.</p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.30)]">
              <p className="text-sm font-semibold text-slate-900">Integracion externa</p>
              <p className="mt-2 text-sm text-slate-500">Conectado por servicios hacia la API PHP 8 alojada fuera del repo.</p>
            </div>
          </div>
        </section>

        <FormularioLogin
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
          authMockEnabled={AUTH_MOCK_ENABLED}
        />
      </div>
    </main>
  )
}
