import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AUTH_MOCK_ENABLED } from '../../../config/env'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cotizacionesMock } from '../../cotizaciones/data/cotizacionesMock'
import { obtenerCotizacionPorId } from '../../cotizaciones/services/cotizacionesApi'
import BuscadorPantallas from '../components/BuscadorPantallas'
import LienzoMapaPlaceholder from '../components/LienzoMapaPlaceholder'
import ModalStreetViewPlaceholder from '../components/ModalStreetViewPlaceholder'
import PanelListadoPantallas from '../components/PanelListadoPantallas'
import { pantallasMock } from '../data/pantallasMock'

function buildMockSource(cotizacionId) {
  const cotizacion =
    cotizacionesMock.find((item) => String(item.id) === String(cotizacionId)) ||
    cotizacionesMock.find((item) => item.id === 'cot-005') ||
    cotizacionesMock[0]

  return {
    cotizacion,
    pantallas: pantallasMock.filter((pantalla) => pantalla.is_active)
  }
}

export default function VistaMapaCliente() {
  const { cotizacionId } = useParams()
  const [busqueda, setBusqueda] = useState('')
  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cotizacion, setCotizacion] = useState(null)
  const [pantallas, setPantallas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function cargarVista() {
      setCargando(true)
      setError('')

      try {
        const detalle = await obtenerCotizacionPorId(cotizacionId)

        if (!active) {
          return
        }

        const pantallasActivas = (detalle.ubicaciones || []).filter((pantalla) => pantalla.is_active)
        setCotizacion(detalle)
        setPantallas(pantallasActivas)
        setPantallaSeleccionadaId(pantallasActivas[0]?.id || null)
      } catch (loadError) {
        if (!active) {
          return
        }

        if (AUTH_MOCK_ENABLED) {
          const source = buildMockSource(cotizacionId)
          setCotizacion(source.cotizacion)
          setPantallas(source.pantallas)
          setPantallaSeleccionadaId(source.pantallas[0]?.id || null)
        } else {
          setCotizacion(null)
          setPantallas([])
          setPantallaSeleccionadaId(null)
          setError(loadError.message || 'No fue posible cargar la vista de mapa.')
        }
      } finally {
        if (active) {
          setCargando(false)
        }
      }
    }

    cargarVista()

    return () => {
      active = false
    }
  }, [cotizacionId])

  const pantallasFiltradas = useMemo(() => {
    const search = busqueda.trim().toLowerCase()

    return pantallas.filter((pantalla) => {
      if (!search) {
        return true
      }

      return (
        pantalla.screenName.toLowerCase().includes(search) ||
        pantalla.city.toLowerCase().includes(search)
      )
    })
  }, [pantallas, busqueda])

  const pantallaSeleccionada =
    pantallasFiltradas.find((pantalla) => pantalla.id === pantallaSeleccionadaId) ||
    pantallasFiltradas[0] ||
    null

  const seleccionarPantalla = (id) => {
    setPantallaSeleccionadaId(id)
  }

  if (cargando) {
    return (
      <Tarjeta className="text-center">
        <p className="text-lg font-medium text-slate-900">Cargando vista de mapa...</p>
        <p className="mt-2 text-sm text-slate-500">
          Recuperando la cotizacion y sus pantallas activas desde backend.
        </p>
      </Tarjeta>
    )
  }

  if (error) {
    return (
      <Tarjeta className="space-y-4 text-center">
        <p className="text-lg font-medium text-slate-900">No fue posible abrir esta vista.</p>
        <p className="text-sm text-rose-700">{error}</p>
        <div className="flex justify-center">
          <Boton onClick={() => window.location.reload()}>
            Reintentar
          </Boton>
        </div>
      </Tarjeta>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Visualizacion dual cliente final
        </p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              {cotizacion?.nombreCampana || 'Cotizacion sin nombre'}
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Split-layout preparado para validar pantallas activas, sincronizar seleccion entre listado y mapa,
              y abrir posteriormente Street View real por coordenadas.
            </p>
          </div>

          <Tarjeta className="min-w-[260px] space-y-2 bg-slate-950 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Cliente</p>
            <p className="text-2xl font-semibold">{cotizacion?.cliente || '-'}</p>
            <p className="text-sm text-slate-300">
              Pantallas visibles: {pantallasFiltradas.length}
            </p>
          </Tarjeta>
        </div>
      </section>

      {pantallas.length === 0 ? (
        <Tarjeta className="text-center">
          <p className="text-lg font-medium text-slate-900">No hay pantallas activas disponibles.</p>
          <p className="mt-2 text-sm text-slate-500">
            Cuando la cotizacion tenga pantallas activas apareceran en esta vista placeholder.
          </p>
        </Tarjeta>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
            <BuscadorPantallas
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />

            <PanelListadoPantallas
              pantallas={pantallasFiltradas}
              pantallaSeleccionadaId={pantallaSeleccionadaId}
              seleccionarPantalla={seleccionarPantalla}
              onValidarEntorno={() => setModalOpen(true)}
            />
          </div>

          <LienzoMapaPlaceholder
            pantallas={pantallasFiltradas}
            pantallaSeleccionada={pantallaSeleccionada}
            seleccionarPantalla={seleccionarPantalla}
          />
        </div>
      )}

      <ModalStreetViewPlaceholder
        open={modalOpen}
        pantalla={pantallaSeleccionada}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
