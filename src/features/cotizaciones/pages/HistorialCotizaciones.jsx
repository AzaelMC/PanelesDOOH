import { useMemo, useState } from 'react'
import Tarjeta from '../../../components/ui/Tarjeta'
import FiltrosCotizaciones from '../components/FiltrosCotizaciones'
import TarjetaCotizacion from '../components/TarjetaCotizacion'
import { cotizacionesMock } from '../data/cotizacionesMock'

export default function HistorialCotizaciones() {
  const [busqueda, setBusqueda] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('')

  const usuarios = useMemo(() => {
    const uniqueUsers = new Map()

    cotizacionesMock.forEach((cotizacion) => {
      if (!uniqueUsers.has(cotizacion.usuarioCreadorId)) {
        uniqueUsers.set(cotizacion.usuarioCreadorId, {
          id: cotizacion.usuarioCreadorId,
          nombre: cotizacion.usuarioCreadorNombre
        })
      }
    })

    return Array.from(uniqueUsers.values())
  }, [])

  const cotizacionesFiltradas = useMemo(() => {
    const search = busqueda.trim().toLowerCase()

    return cotizacionesMock.filter((cotizacion) => {
      const matchesSearch =
        !search ||
        cotizacion.nombreCampana.toLowerCase().includes(search) ||
        cotizacion.cliente.toLowerCase().includes(search)

      const matchesUser =
        !usuarioSeleccionado || cotizacion.usuarioCreadorId === usuarioSeleccionado

      return matchesSearch && matchesUser
    })
  }, [busqueda, usuarioSeleccionado])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Repositorio de propuestas
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              Historial de Cotizaciones
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Explora propuestas anteriores, identifica al creador responsable y abre directamente
              los flujos de tratamiento o visualizacion para cliente.
            </p>
          </div>

          <Tarjeta className="min-w-[240px] bg-white/80 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Resultados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {cotizacionesFiltradas.length}
            </p>
          </Tarjeta>
        </div>
      </section>

      <FiltrosCotizaciones
        busqueda={busqueda}
        usuarioSeleccionado={usuarioSeleccionado}
        usuarios={usuarios}
        onBusquedaChange={(event) => setBusqueda(event.target.value)}
        onUsuarioChange={(event) => setUsuarioSeleccionado(event.target.value)}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        {cotizacionesFiltradas.map((cotizacion) => (
          <TarjetaCotizacion key={cotizacion.id} cotizacion={cotizacion} />
        ))}
      </section>

      {cotizacionesFiltradas.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-medium text-slate-900">No hay cotizaciones que coincidan.</p>
          <p className="mt-2 text-sm text-slate-500">
            Ajusta la busqueda o libera el filtro por usuario para ampliar el resultado.
          </p>
        </Tarjeta>
      )}
    </div>
  )
}
