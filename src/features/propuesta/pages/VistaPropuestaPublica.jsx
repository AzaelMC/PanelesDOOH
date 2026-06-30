import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import BuscadorPropuestaPublica from '../components/BuscadorPropuestaPublica'
import ListadoPropuestaPublica from '../components/ListadoPropuestaPublica'
import MapaPropuestaPublica from '../components/MapaPropuestaPublica'
import StreetViewPropuestaPublica from '../components/StreetViewPropuestaPublica'
import { obtenerSnapshotPublico } from '../services/propuestaPublicaApi'
import { normalizarPantallasSnapshot } from '../utils/prepararPantallasPropuesta'

const NTP_ICON_SRC = `${import.meta.env.BASE_URL}brand/ntp-icon.png`

function HeadbarPropuestaPublica() {
  return (
    <header className="sticky top-0 z-40 bg-[#411189] text-white shadow-[0_18px_45px_rgba(65,17,137,0.24)]">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 p-2 shadow-sm">
          <img
            src={NTP_ICON_SRC}
            alt="NTP Media"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <p className="text-sm font-semibold tracking-[0.18em] text-white sm:text-base">
          NTP Media / DOOH Maps
        </p>
      </div>
    </header>
  )
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

function obtenerCotizacionSnapshot(snapshot = {}) {
  const cotizacion = snapshot?.cotizacion && typeof snapshot.cotizacion === 'object'
    ? snapshot.cotizacion
    : {}

  return {
    id: cotizacion.id || null,
    nombreCampana: cotizacion.nombreCampana || cotizacion.nombre_campana || 'Cotizacion sin nombre',
    cliente: cotizacion.cliente || cotizacion.nombreCliente || cotizacion.nombre_cliente || '-',
    totalPantallas: cotizacion.totalPantallas ?? null,
    totalPantallasActivas: cotizacion.totalPantallasActivas ?? null
  }
}

function obtenerRegionesPantallas(pantallas = []) {
  const regiones = new Set()

  pantallas.forEach((pantalla) => {
    const region = String(pantalla?.city || '').trim()

    if (!region || region.toLowerCase() === 'sin ciudad') {
      return
    }

    regiones.add(region)
  })

  return Array.from(regiones).sort((a, b) => a.localeCompare(b, 'es'))
}

export default function VistaPropuestaPublica() {
  const { token = '' } = useParams()
  const [snapshot, setSnapshot] = useState(null)
  const [cotizacion, setCotizacion] = useState(null)
  const [pantallas, setPantallas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const busquedaDebounced = useDebouncedValue(busqueda, 250)
  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [centrarSeleccion, setCentrarSeleccion] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const cargarSnapshot = useCallback(async () => {
    const tokenLimpio = String(token || '').trim()

    if (!tokenLimpio) {
      setSnapshot(null)
      setCotizacion(null)
      setPantallas([])
      setPantallaSeleccionadaId(null)
      setError('La liga no contiene un token valido.')
      setCargando(false)
      return
    }

    setCargando(true)
    setError('')

    try {
      const snapshotPayload = await obtenerSnapshotPublico(tokenLimpio)
      const pantallasSnapshot = normalizarPantallasSnapshot(snapshotPayload)

      setSnapshot(snapshotPayload)
      setCotizacion(obtenerCotizacionSnapshot(snapshotPayload))
      setPantallas(pantallasSnapshot)
      setPantallaSeleccionadaId(pantallasSnapshot[0]?.id || null)
      setCentrarSeleccion(false)
    } catch (loadError) {
      setSnapshot(null)
      setCotizacion(null)
      setPantallas([])
      setPantallaSeleccionadaId(null)
      setCentrarSeleccion(false)
      setError(loadError.message || 'Esta liga no esta disponible o ya expiro.')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    cargarSnapshot()
  }, [cargarSnapshot])

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

  const regiones = useMemo(() => obtenerRegionesPantallas(pantallas), [pantallas])

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
      <div className="min-h-screen">
        <HeadbarPropuestaPublica />
        <main className="ntp-shell ntp-aurora-bg min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Tarjeta className="text-center">
              <p className="text-lg font-medium text-slate-900">Cargando propuesta...</p>
              <p className="mt-2 text-sm text-slate-500">
                Recuperando pantallas congeladas para esta liga publica.
              </p>
            </Tarjeta>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <HeadbarPropuestaPublica />
        <main className="ntp-shell ntp-aurora-bg min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[960px]">
            <Tarjeta className="space-y-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
                Propuesta DOOH
              </p>
              <p className="text-lg font-medium text-slate-900">No fue posible abrir esta liga.</p>
              <p className="text-sm text-rose-700">{error}</p>
              <div className="flex justify-center">
                <Boton onClick={cargarSnapshot}>
                  Reintentar
                </Boton>
              </div>
            </Tarjeta>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <HeadbarPropuestaPublica />
      <main className="ntp-shell ntp-aurora-bg min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
          <Tarjeta className="space-y-5">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {cotizacion?.nombreCampana || 'Cotizacion sin nombre'}
          </h2>

          <dl className="grid gap-3 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="font-semibold uppercase tracking-[0.22em] text-slate-500">
              Pantallas:
            </dt>
            <dd className="font-medium text-slate-950">
              {pantallas.length}
            </dd>

            {regiones.length > 0 ? (
              <>
                <dt className="font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Regiones:
                </dt>
                <dd className="leading-6 text-slate-700">
                  {regiones.join(', ')}
                </dd>
              </>
            ) : null}
          </dl>
          </Tarjeta>

          {pantallas.length === 0 ? (
          <Tarjeta className="text-center">
            <p className="text-lg font-medium text-slate-900">No hay pantallas activas disponibles.</p>
            <p className="mt-2 text-sm text-slate-500">
              Esta propuesta publica no tiene pantallas activas congeladas para mostrar.
            </p>
          </Tarjeta>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="space-y-5">
              <BuscadorPropuestaPublica
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />

              <ListadoPropuestaPublica
                pantallas={pantallasFiltradas}
                pantallaSeleccionadaId={pantallaSeleccionadaId}
                seleccionarPantalla={seleccionarPantalla}
                onValidarEntorno={abrirValidacionEntorno}
              />
            </div>

            <MapaPropuestaPublica
              pantallas={pantallasFiltradas}
              pantallaSeleccionada={pantallaSeleccionada}
              seleccionarPantalla={seleccionarPantalla}
              centrarSeleccion={centrarSeleccion}
            />
          </div>
          )}

          <StreetViewPropuestaPublica
            open={modalOpen}
            pantalla={pantallaSeleccionada}
            onClose={cerrarValidacionEntorno}
          />
        </div>
      </main>
    </div>
  )
}
