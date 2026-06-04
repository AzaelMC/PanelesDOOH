import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const cacheCotizacionesMapa = new Map()

function obtenerCotizacionMapa(cotizacionId) {
  const cacheKey = String(cotizacionId || '')

  if (cacheCotizacionesMapa.has(cacheKey)) {
    return cacheCotizacionesMapa.get(cacheKey)
  }

  const request = obtenerCotizacionPorId(cotizacionId).catch((error) => {
    cacheCotizacionesMapa.delete(cacheKey)
    throw error
  })

  cacheCotizacionesMapa.set(cacheKey, request)
  return request
}

function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [value, delay])

  return debouncedValue
}

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
  const busquedaDebounced = useDebouncedValue(busqueda, 250)

  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [centrarSeleccion, setCentrarSeleccion] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [cotizacion, setCotizacion] = useState(null)
  const [pantallas, setPantallas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const ultimaCotizacionSolicitadaRef = useRef(null)

  useEffect(() => {
    let active = true
    const cotizacionKey = String(cotizacionId || '')

    async function cargarVista() {
      if (!cotizacionKey) {
        setCotizacion(null)
        setPantallas([])
        setPantallaSeleccionadaId(null)
        setError('No se recibio el identificador de cotizacion.')
        setCargando(false)
        return
      }

      ultimaCotizacionSolicitadaRef.current = cotizacionKey
      setCargando(true)
      setError('')

      try {
        const detalle = await obtenerCotizacionMapa(cotizacionId)

        if (!active || ultimaCotizacionSolicitadaRef.current !== cotizacionKey) {
          return
        }

        const pantallasActivas = (detalle.ubicaciones || []).filter((pantalla) => pantalla.is_active)
        setCotizacion(detalle)
        setPantallas(pantallasActivas)
        setPantallaSeleccionadaId(pantallasActivas[0]?.id || null)
        setCentrarSeleccion(false)
      } catch (loadError) {
        if (!active || ultimaCotizacionSolicitadaRef.current !== cotizacionKey) {
          return
        }

        if (AUTH_MOCK_ENABLED) {
          const source = buildMockSource(cotizacionId)
          setCotizacion(source.cotizacion)
          setPantallas(source.pantallas)
          setPantallaSeleccionadaId(source.pantallas[0]?.id || null)
          setCentrarSeleccion(false)
        } else {
          setCotizacion(null)
          setPantallas([])
          setPantallaSeleccionadaId(null)
          setCentrarSeleccion(false)
          setError(loadError.message || 'No fue posible cargar la vista de mapa.')
        }
      } finally {
        if (active && ultimaCotizacionSolicitadaRef.current === cotizacionKey) {
          setCargando(false)
        }
      }
    }

    cargarVista()

    return () => {
      active = false
    }
  }, [cotizacionId])

  useEffect(() => {
    setCentrarSeleccion(false)
  }, [busquedaDebounced])

  const pantallasFiltradas = useMemo(() => {
    const search = busquedaDebounced.trim().toLowerCase()

    return pantallas.filter((pantalla) => {
      if (!search) {
        return true
      }

      return (
        String(pantalla.screenName || '').toLowerCase().includes(search) ||
        String(pantalla.city || '').toLowerCase().includes(search)
      )
    })
  }, [pantallas, busquedaDebounced])

  const pantallaSeleccionada = useMemo(() => {
    return (
      pantallasFiltradas.find((pantalla) => pantalla.id === pantallaSeleccionadaId) ||
      pantallasFiltradas[0] ||
      null
    )
  }, [pantallasFiltradas, pantallaSeleccionadaId])

  const seleccionarPantalla = useCallback((id) => {
    setPantallaSeleccionadaId(id)
    setCentrarSeleccion(true)
  }, [])

  const abrirValidacionEntorno = useCallback(() => {
    setModalOpen(true)
  }, [])

  const cerrarValidacionEntorno = useCallback(() => {
    setModalOpen(false)
  }, [])

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
              onValidarEntorno={abrirValidacionEntorno}
            />
          </div>

          <LienzoMapaPlaceholder
            pantallas={pantallasFiltradas}
            pantallaSeleccionada={pantallaSeleccionada}
            seleccionarPantalla={seleccionarPantalla}
            centrarSeleccion={centrarSeleccion}
          />
        </div>
      )}

      <ModalStreetViewPlaceholder
        open={modalOpen}
        pantalla={pantallaSeleccionada}
        onClose={cerrarValidacionEntorno}
      />
    </div>
  )
}