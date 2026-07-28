import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AUTH_MOCK_ENABLED } from '../../../config/env'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cotizacionesMock } from '../../cotizaciones/data/cotizacionesMock'
import { obtenerCotizacionPorId } from '../../cotizaciones/services/cotizacionesApi'
import { obtenerCpmCotizacion } from '../../tratamiento/services/cpmApi'
import BuscadorPantallas from '../components/BuscadorPantallas'
import CabeceraMapaCliente from '../components/CabeceraMapaCliente'
import LienzoMapaPlaceholder from '../components/LienzoMapaPlaceholder'
import ModalStreetViewPlaceholder from '../components/ModalStreetViewPlaceholder'
import PanelListadoPantallas from '../components/PanelListadoPantallas'
import ChatPropuesta from '../../chat/components/ChatPropuesta'
import { escucharAlertasChat, escucharChatLeido } from '../../chat/utils/eventosChat'
import { pantallasMock } from '../data/pantallasMock'

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
    cpm: null,
    pantallas: pantallasMock.filter((pantalla) => pantalla.is_active)
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

export default function VistaMapaCliente() {
  const { cotizacionId } = useParams()
  const [busqueda, setBusqueda] = useState('')
  const busquedaDebounced = useDebouncedValue(busqueda, 250)

  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [centrarSeleccion, setCentrarSeleccion] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [cotizacion, setCotizacion] = useState(null)
  const [cpm, setCpm] = useState(null)
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
        setCpm(null)
        setPantallas([])
        setPantallaSeleccionadaId(null)
        setError('No se pudo cargar')
        setCargando(false)
        return
      }

      ultimaCotizacionSolicitadaRef.current = cotizacionKey
      setCargando(true)
      setError('')

      try {
        const [detalle, cpmDetalle] = await Promise.all([
          obtenerCotizacionPorId(cotizacionId),
          obtenerCpmCotizacion(cotizacionId).catch(() => null)
        ])

        if (!active || ultimaCotizacionSolicitadaRef.current !== cotizacionKey) {
          return
        }

        const pantallasActivas = (detalle.ubicaciones || []).filter((pantalla) => pantalla.is_active)
        setCotizacion(detalle)
        setCpm(cpmDetalle)
        setPantallas(pantallasActivas)
        setPantallaSeleccionadaId(null)
        setCentrarSeleccion(false)
      } catch (loadError) {
        if (!active || ultimaCotizacionSolicitadaRef.current !== cotizacionKey) {
          return
        }

        if (AUTH_MOCK_ENABLED) {
          const source = buildMockSource(cotizacionId)
          setCotizacion(source.cotizacion)
          setCpm(source.cpm)
          setPantallas(source.pantallas)
          setPantallaSeleccionadaId(null)
          setCentrarSeleccion(false)
        } else {
          setCotizacion(null)
          setCpm(null)
          setPantallas([])
          setPantallaSeleccionadaId(null)
          setCentrarSeleccion(false)
          setError(loadError.message || 'No se pudo cargar')
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
    const limpiarAlertas = escucharAlertasChat(({ alertas = [] }) => {
      const tieneAlerta = (Array.isArray(alertas) ? alertas : []).some(
        (alerta) => String(alerta.cotizacionId || alerta.cotizacion_id) === String(cotizacionId)
      )

      setCotizacion((current) => current
        ? {
            ...current,
            tieneMensajeNuevo: tieneAlerta,
            tiene_mensaje_nuevo: tieneAlerta
          }
        : current)
    })

    const limpiarLeido = escucharChatLeido(({ cotizacionId: cotizacionLeidaId }) => {
      if (String(cotizacionLeidaId) !== String(cotizacionId)) {
        return
      }

      setCotizacion((current) => current
        ? {
            ...current,
            tieneMensajeNuevo: false,
            tiene_mensaje_nuevo: false
          }
        : current)
    })

    return () => {
      limpiarAlertas()
      limpiarLeido()
    }
  }, [cotizacionId])

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

  const marcarMensajesLeidos = useCallback(() => {
    setCotizacion((current) => current
      ? {
          ...current,
          tiene_mensaje_nuevo: false,
          tieneMensajeNuevo: false,
          mensajes_cliente_no_leidos: 0,
          mensajesClienteNoLeidos: 0
        }
      : current)
  }, [])

  if (cargando) {
    return (
      <Tarjeta className="text-center">
        <p className="text-lg font-medium text-slate-900">Cargando mapa</p>
      </Tarjeta>
    )
  }

  if (error) {
    return (
      <Tarjeta className="space-y-4 text-center">
        <p className="text-lg font-medium text-slate-900">No se pudo cargar</p>
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
    <div className="space-y-6">
      <CabeceraMapaCliente
        cotizacion={cotizacion}
        cpm={cpm}
        pantallas={pantallas}
        regiones={regiones}
        mostrarEstadoPropuesta
      />

      {pantallas.length === 0 ? (
        <Tarjeta className="text-center">
          <p className="text-lg font-medium text-slate-900">Sin pantallas</p>
        </Tarjeta>
      ) : (
        <div className="grid gap-6 xl:h-[720px] xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-5">
            <BuscadorPantallas
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
          />
        </div>
      )}

      <ChatPropuesta
        key={cotizacionId}
        modo="interno"
        cotizacionId={cotizacionId}
        nombreCampana={cotizacion?.nombreCampana || cotizacion?.nombre_campana || ''}
        estadoPropuesta={cotizacion?.estadoPropuesta || cotizacion?.estado_propuesta}
        tieneMensajeNuevo={Boolean(cotizacion?.tieneMensajeNuevo || cotizacion?.tiene_mensaje_nuevo)}
        onMensajesLeidos={marcarMensajesLeidos}
      />

      <ModalStreetViewPlaceholder
        open={modalOpen}
        pantalla={pantallaSeleccionada}
        onClose={cerrarValidacionEntorno}
      />
    </div>
  )
}
