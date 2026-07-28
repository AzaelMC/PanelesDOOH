import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import BuscadorPantallas from '../../mapa-cliente/components/BuscadorPantallas'
import CabeceraMapaCliente from '../../mapa-cliente/components/CabeceraMapaCliente'
import LienzoMapaPlaceholder from '../../mapa-cliente/components/LienzoMapaPlaceholder'
import ModalStreetViewPlaceholder from '../../mapa-cliente/components/ModalStreetViewPlaceholder'
import PanelListadoPantallas from '../../mapa-cliente/components/PanelListadoPantallas'
import ChatPropuesta from '../../chat/components/ChatPropuesta'
import {
  cargarGoogleMapsMarkerPublico,
  cargarGoogleMapsPublico,
  obtenerGoogleMapsPublicConfig
} from '../../../services/googleMapsPublicLoader'
import { obtenerPropuestaPublica, obtenerUrlExcelPublico } from '../services/propuestaPublicaApi'

const NTP_ICON_SRC = `${import.meta.env.BASE_URL}brand/ntp-icon.png`

function HeadbarPropuestaPublica({ excelUrl = '' }) {
  return (
    <header className="ntp-headbar">
      <div className="relative mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="ntp-brand-mark flex h-14 w-14 items-center justify-center rounded-3xl p-3">
          <img
            src={NTP_ICON_SRC}
            alt="NTP Media"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ntp-nav-text)]">
            NTP Media
          </p>
          <h1 className="ntp-page-title text-xl">DOOH Maps</h1>
        </div>

        {excelUrl && (
          <Boton
            as="a"
            href={excelUrl}
            variant="brandSecondary"
            className="ml-auto gap-2 whitespace-nowrap !border-[#9E6DF7] !bg-[#9E6DF7] !text-white hover:!border-[#8a56f2] hover:!bg-[#8a56f2]"
            aria-label="Descargar propuesta en Excel"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span className="hidden sm:inline">Descargar Excel</span>
            <span className="sm:hidden">Excel</span>
          </Boton>
        )}
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

function obtenerRegionesPantallas(pantallas = [], resumen = {}) {
  if (Array.isArray(resumen?.regiones) && resumen.regiones.length > 0) {
    return resumen.regiones
  }

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
  const [propuesta, setPropuesta] = useState(null)
  const [cotizacion, setCotizacion] = useState(null)
  const [cpm, setCpm] = useState(null)
  const [pantallas, setPantallas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const busquedaDebounced = useDebouncedValue(busqueda, 250)
  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [centrarSeleccion, setCentrarSeleccion] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const excelUrl = obtenerUrlExcelPublico(token)

  const cargarPropuesta = useCallback(async () => {
    const tokenLimpio = String(token || '').trim()

    if (!tokenLimpio) {
      setPropuesta(null)
      setCotizacion(null)
      setCpm(null)
      setPantallas([])
      setPantallaSeleccionadaId(null)
      setError('No se pudo cargar')
      setCargando(false)
      return
    }

    setCargando(true)
    setError('')

    try {
      const payload = await obtenerPropuestaPublica(tokenLimpio)

      setPropuesta(payload)
      setCotizacion(payload.cotizacion)
      setCpm(payload.cpm)
      setPantallas(payload.pantallas)
      setPantallaSeleccionadaId(null)
      setCentrarSeleccion(false)
    } catch (loadError) {
      setPropuesta(null)
      setCotizacion(null)
      setCpm(null)
      setPantallas([])
      setPantallaSeleccionadaId(null)
      setCentrarSeleccion(false)
      setError(loadError.message || 'No se pudo cargar')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cargarPropuesta()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [cargarPropuesta])

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
    return pantallasFiltradas.find((pantalla) => pantalla.id === pantallaSeleccionadaId) || null
  }, [pantallasFiltradas, pantallaSeleccionadaId])

  const regiones = useMemo(
    () => obtenerRegionesPantallas(pantallas, propuesta?.resumen),
    [pantallas, propuesta]
  )

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

  const actualizarEstadoAceptado = useCallback((estadoPropuesta = 'aceptada') => {
    setCotizacion((current) => current
      ? {
          ...current,
          estadoPropuesta,
          estado_propuesta: estadoPropuesta,
          fechaEstadoPropuesta: current.fechaEstadoPropuesta || current.fecha_estado_propuesta || new Date().toISOString(),
          fecha_estado_propuesta: current.fecha_estado_propuesta || current.fechaEstadoPropuesta || new Date().toISOString()
        }
      : current)
    setPropuesta((current) => current
      ? {
          ...current,
          cotizacion: current.cotizacion
            ? {
                ...current.cotizacion,
                estadoPropuesta,
                estado_propuesta: estadoPropuesta
              }
            : current.cotizacion,
          resumen: current.resumen
            ? {
                ...current.resumen,
                estadoPropuesta,
                estado_propuesta: estadoPropuesta
              }
            : current.resumen
        }
      : current)
  }, [])

  if (cargando) {
    return (
      <div className="min-h-screen">
        <HeadbarPropuestaPublica />
        <main className="ntp-shell ntp-aurora-bg min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Tarjeta className="text-center">
              <p className="text-lg font-medium text-slate-900">Cargando mapa</p>
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
              <p className="text-lg font-medium text-slate-900">No se pudo cargar</p>
              <p className="text-sm text-rose-700">{error}</p>
              <div className="flex justify-center">
                <Boton onClick={cargarPropuesta}>
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
      <HeadbarPropuestaPublica excelUrl={excelUrl} />
      <main className="ntp-shell ntp-aurora-bg min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <CabeceraMapaCliente
          cotizacion={cotizacion}
          cpm={cpm}
          pantallas={pantallas}
          regiones={regiones}
        />

        {pantallas.length === 0 ? (
          <Tarjeta className="text-center">
            <p className="text-lg font-medium text-slate-900">Sin pantallas</p>
          </Tarjeta>
        ) : (
          <div className="grid gap-6 xl:h-[720px] xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-5">
              <BuscadorPantallas
                name="busquedaPantallaPropuesta"
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value)
                  setCentrarSeleccion(false)
                }}
              />

              <PanelListadoPantallas
                className="xl:min-h-0"
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
              cargarMaps={cargarGoogleMapsPublico}
              cargarMarker={cargarGoogleMapsMarkerPublico}
              obtenerMapsConfig={obtenerGoogleMapsPublicConfig}
            />
          </div>
        )}

        <ChatPropuesta
          key={token}
          modo="publico"
          token={token}
          nombreCampana={cotizacion?.nombreCampana || cotizacion?.nombre_campana || ''}
          estadoPropuesta={cotizacion?.estadoPropuesta || cotizacion?.estado_propuesta}
          onEstadoAceptado={actualizarEstadoAceptado}
        />

          <ModalStreetViewPlaceholder
            open={modalOpen}
            pantalla={pantallaSeleccionada}
            onClose={cerrarValidacionEntorno}
            cargarMaps={cargarGoogleMapsPublico}
          />
        </div>
      </main>
    </div>
  )
}
