import { useEffect, useMemo, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import FiltrosCotizaciones from '../components/FiltrosCotizaciones'
import TarjetaCotizacion from '../components/TarjetaCotizacion'
import { obtenerCotizaciones } from '../services/cotizacionesApi'

export default function HistorialCotizaciones() {
  const [busqueda, setBusqueda] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('')
  const [estatusSeleccionado, setEstatusSeleccionado] = useState('')
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function cargarCotizaciones() {
      setCargando(true)
      setError('')

      try {
        const response = await obtenerCotizaciones()

        if (active) {
          setCotizaciones(response.cotizaciones)
        }
      } catch (loadError) {
        if (active) {
          setCotizaciones([])
          setError(loadError.message || 'No fue posible cargar las cotizaciones.')
        }
      } finally {
        if (active) {
          setCargando(false)
        }
      }
    }

    cargarCotizaciones()

    return () => {
      active = false
    }
  }, [])

  const usuarios = useMemo(() => {
    const uniqueUsers = new Map()

    cotizaciones.forEach((cotizacion) => {
      if (!uniqueUsers.has(cotizacion.usuarioCreadorId)) {
        uniqueUsers.set(cotizacion.usuarioCreadorId, {
          id: cotizacion.usuarioCreadorId,
          nombre: cotizacion.usuarioCreadorNombre || 'Sin asignar'
        })
      }
    })

    return Array.from(uniqueUsers.values())
  }, [cotizaciones])

  const estatusDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        cotizaciones
          .map((cotizacion) => cotizacion.estado)
          .filter(Boolean)
      )
    )
  }, [cotizaciones])

  const cotizacionesFiltradas = useMemo(() => {
    const search = busqueda.trim().toLowerCase()

    return cotizaciones.filter((cotizacion) => {
      const matchesSearch =
        !search ||
        cotizacion.nombreCampana.toLowerCase().includes(search) ||
        cotizacion.cliente.toLowerCase().includes(search)

      const matchesUser =
        !usuarioSeleccionado || String(cotizacion.usuarioCreadorId) === String(usuarioSeleccionado)

      const matchesStatus =
        !estatusSeleccionado || cotizacion.estado === estatusSeleccionado

      return matchesSearch && matchesUser && matchesStatus
    })
  }, [busqueda, cotizaciones, estatusSeleccionado, usuarioSeleccionado])

  const filtrosActivos = Boolean(busqueda.trim() || usuarioSeleccionado || estatusSeleccionado)

  return (
    <div className="ntp-aurora-bg--history space-y-8">
      <section className="space-y-4">
        <p className="ntp-page-eyebrow">
          Repositorio de propuestas
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="ntp-page-title text-4xl">
              Historial de Cotizaciones
            </h2>
            <p className="ntp-body-copy text-base leading-8">
              Explora propuestas guardadas en backend, identifica al creador responsable y abre directamente
              los flujos de tratamiento o visualizacion para cliente.
            </p>
          </div>

          <Tarjeta className="ntp-glass-card-strong min-w-[240px] text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Resultados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {cargando ? '...' : cotizacionesFiltradas.length}
            </p>
          </Tarjeta>
        </div>
      </section>

      <FiltrosCotizaciones
        busqueda={busqueda}
        usuarioSeleccionado={usuarioSeleccionado}
        estatusSeleccionado={estatusSeleccionado}
        usuarios={usuarios}
        estatusDisponibles={estatusDisponibles}
        onBusquedaChange={(event) => setBusqueda(event.target.value)}
        onUsuarioChange={(event) => setUsuarioSeleccionado(event.target.value)}
        onEstatusChange={(event) => setEstatusSeleccionado(event.target.value)}
      />

      {cargando && (
        <Tarjeta className="ntp-glass-card text-center">
          <p className="text-lg font-medium text-slate-900">Cargando cotizaciones...</p>
          <p className="mt-2 text-sm text-slate-500">
            Consultando GET /cotizaciones.php para recuperar el historial real.
          </p>
        </Tarjeta>
      )}

      {!cargando && error && (
        <Tarjeta className="ntp-glass-card space-y-4 text-center">
          <p className="text-lg font-medium text-slate-900">No fue posible cargar el historial.</p>
          <p className="text-sm text-rose-700">{error}</p>
          <div className="flex justify-center">
            <Boton variant="brand" onClick={() => window.location.reload()}>
              Reintentar
            </Boton>
          </div>
        </Tarjeta>
      )}

      {!cargando && !error && cotizacionesFiltradas.length > 0 && (
        <section className="grid gap-6 xl:grid-cols-2">
          {cotizacionesFiltradas.map((cotizacion) => (
            <TarjetaCotizacion key={cotizacion.id} cotizacion={cotizacion} />
          ))}
        </section>
      )}

      {!cargando && !error && cotizacionesFiltradas.length === 0 && (
        <Tarjeta className="ntp-glass-card text-center">
          <p className="text-lg font-medium text-slate-900">
            {filtrosActivos ? 'No hay cotizaciones que coincidan.' : 'No hay cotizaciones guardadas todavia.'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {filtrosActivos
              ? 'Ajusta la busqueda o libera los filtros para ampliar el resultado.'
              : 'Cuando se guarde una cotizacion real desde Nueva Cotizacion aparecera aqui.'}
          </p>
        </Tarjeta>
      )}
    </div>
  )
}
