import { useEffect, useMemo, useRef, useState } from 'react'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cargarGoogleMaps, tieneGoogleMapsApiKey } from '../../../services/googleMapsLoader'
import { prepararPantallasMapa } from '../utils/prepararPantallasMapa'

const ZOOM_MAXIMO_INICIAL = 13
const ZOOM_SELECCION = 16

const MAPA_INICIAL = {
  center: { lat: 23.6345, lng: -102.5528 },
  zoom: 5,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false
}

function crearIconoMarcador(color = '#0f172a') {
  const svg = `
    <svg width="46" height="56" viewBox="0 0 46 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 2C11.95 2 3 10.95 3 22C3 37 23 54 23 54C23 54 43 37 43 22C43 10.95 34.05 2 23 2Z" fill="${color}" stroke="white" stroke-width="4"/>
      <circle cx="23" cy="22" r="7" fill="white"/>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(46, 56),
    anchor: new window.google.maps.Point(23, 56)
  }
}

function formatearImpresiones(value) {
  if (!Number.isFinite(value)) {
    return 'Sin dato'
  }

  return value.toLocaleString('es-MX')
}

function aplicarEstiloMarcador(markerData, selected, iconos) {
  if (!markerData?.marker || !iconos) {
    return
  }

  markerData.marker.setIcon(selected ? iconos.seleccionado : iconos.base)
  markerData.marker.setZIndex(selected ? 20 : 10)
  markerData.marker.setLabel({
    text: markerData.pantalla.city?.slice(0, 2).toUpperCase() || 'DO',
    color: selected ? '#ffffff' : '#0f172a',
    fontSize: '11px',
    fontWeight: '700'
  })
}

export default function LienzoMapaPlaceholder({
  pantallas,
  pantallaSeleccionada,
  seleccionarPantalla,
  centrarSeleccion = false
}) {
  const mapaRef = useRef(null)
  const instanciaMapaRef = useRef(null)
  const mapsRef = useRef(null)
  const marcadoresRef = useRef(new Map())
  const iconosRef = useRef(null)
  const pantallaSeleccionadaAnteriorRef = useRef(null)
  const [mapaListo, setMapaListo] = useState(false)
  const [estado, setEstado] = useState('idle')
  const [mensajeError, setMensajeError] = useState('')

  const { pantallasValidas, pantallasInvalidas } = useMemo(() => {
    return prepararPantallasMapa(pantallas)
  }, [pantallas])

  const mensajeConfiguracion = !tieneGoogleMapsApiKey()
    ? 'No se encontro la API key de Google Maps. Revisa VITE_GOOGLE_MAPS_API_KEY en .env.local.'
    : ''

  const mensajeCoordenadas = pantallasValidas.length === 0
    ? 'No hay pantallas con latitud y longitud validas para pintar en el mapa.'
    : ''

  const estadoVisible = mensajeConfiguracion
    ? 'error'
    : mensajeCoordenadas
      ? 'sin-coordenadas'
      : estado

  const mensajeVisible = mensajeConfiguracion || mensajeCoordenadas || mensajeError

  const pantallaSeleccionadaPreparada = useMemo(() => {
    if (!pantallaSeleccionada) {
      return null
    }

    return prepararPantallasMapa([pantallaSeleccionada]).pantallasValidas[0] || null
  }, [pantallaSeleccionada])

  useEffect(() => {
    if (mensajeConfiguracion) {
      return undefined
    }

    let cancelado = false

    async function inicializarMapa() {
      try {
        setEstado('cargando')
        setMensajeError('')

        const maps = await cargarGoogleMaps()

        if (cancelado || !mapaRef.current) {
          return
        }

        mapsRef.current = maps

        if (!instanciaMapaRef.current) {
          instanciaMapaRef.current = new maps.Map(mapaRef.current, MAPA_INICIAL)
        }

        iconosRef.current = {
          base: crearIconoMarcador('#334155'),
          seleccionado: crearIconoMarcador('#0f172a')
        }

        setMapaListo(true)
        setEstado('listo')
      } catch (error) {
        if (!cancelado) {
          setEstado('error')
          setMensajeError(error.message || 'No se pudo cargar Google Maps.')
        }
      }
    }

    inicializarMapa()

    return () => {
      cancelado = true
    }
  }, [mensajeConfiguracion])

  useEffect(() => {
    if (!mapaListo || !instanciaMapaRef.current || !mapsRef.current) {
      return undefined
    }

    const map = instanciaMapaRef.current
    const maps = mapsRef.current

    marcadoresRef.current.forEach(({ marker }) => {
      marker.setMap(null)
    })
    marcadoresRef.current.clear()
    pantallaSeleccionadaAnteriorRef.current = null

    if (pantallasValidas.length === 0) {
      setEstado('listo')
      return undefined
    }

    setEstado('cargando')

    const bounds = new maps.LatLngBounds()

    pantallasValidas.forEach((pantalla) => {
      bounds.extend(pantalla.latLng)

      const marker = new maps.Marker({
        position: pantalla.latLng,
        map,
        title: pantalla.screenName,
        icon: iconosRef.current.base,
        zIndex: 10,
        label: {
          text: pantalla.city?.slice(0, 2).toUpperCase() || 'DO',
          color: '#0f172a',
          fontSize: '11px',
          fontWeight: '700'
        }
      })

      marker.addListener('click', () => seleccionarPantalla(pantalla.id))

      marcadoresRef.current.set(pantalla.id, {
        marker,
        pantalla
      })
    })

    if (pantallasValidas.length === 1) {
      map.setCenter(pantallasValidas[0].latLng)
      map.setZoom(15)
    } else {
      map.fitBounds(bounds, 72)

      maps.event.addListenerOnce(map, 'idle', () => {
        if ((map.getZoom() || 0) > ZOOM_MAXIMO_INICIAL) {
          map.setZoom(ZOOM_MAXIMO_INICIAL)
        }
      })
    }

    setEstado('listo')

    return undefined
  }, [mapaListo, pantallasValidas, seleccionarPantalla])

  useEffect(() => {
    if (!mapaListo || !instanciaMapaRef.current || !iconosRef.current) {
      return
    }

    const markerAnteriorId = pantallaSeleccionadaAnteriorRef.current

    if (markerAnteriorId && markerAnteriorId !== pantallaSeleccionadaPreparada?.id) {
      aplicarEstiloMarcador(marcadoresRef.current.get(markerAnteriorId), false, iconosRef.current)
    }

    if (!pantallaSeleccionadaPreparada) {
      pantallaSeleccionadaAnteriorRef.current = null
      return
    }

    const markerActual = marcadoresRef.current.get(pantallaSeleccionadaPreparada.id)

    if (!markerActual) {
      pantallaSeleccionadaAnteriorRef.current = null
      return
    }

    aplicarEstiloMarcador(markerActual, true, iconosRef.current)
    pantallaSeleccionadaAnteriorRef.current = pantallaSeleccionadaPreparada.id

    if (centrarSeleccion) {
      instanciaMapaRef.current.panTo(pantallaSeleccionadaPreparada.latLng)
      instanciaMapaRef.current.setZoom(ZOOM_SELECCION)
    }
  }, [mapaListo, pantallaSeleccionadaPreparada, centrarSeleccion])

  useEffect(() => {
    return () => {
      marcadoresRef.current.forEach(({ marker }) => {
        marker.setMap(null)
      })
      marcadoresRef.current.clear()
    }
  }, [])

  return (
    <Tarjeta className="flex h-full min-h-[620px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950">Validacion Geografica</h3>
          <p className="text-sm text-slate-500">
            Mapa interactivo con ubicaciones DOOH desde latitud y longitud.
          </p>
        </div>

        {pantallaSeleccionada && (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Seleccion</p>
            <p className="mt-2 font-semibold text-slate-950">{pantallaSeleccionada.screenName}</p>
            <p className="text-sm text-slate-500">{pantallaSeleccionada.city}</p>
          </div>
        )}
      </div>

      {pantallasInvalidas.length > 0 && (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {pantallasInvalidas.length} pantalla(s) no se pintaron porque no tienen coordenadas validas.
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
        <div ref={mapaRef} className="absolute inset-0" aria-label="Mapa de ubicaciones DOOH" />

        {(estadoVisible === 'cargando' || estadoVisible === 'idle') && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600 backdrop-blur-sm">
            Cargando Google Maps...
          </div>
        )}

        {(estadoVisible === 'error' || estadoVisible === 'sin-coordenadas') && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
            <div className="max-w-md space-y-3 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
              <p className="text-base font-semibold text-slate-950">Mapa no disponible</p>
              <p className="text-sm leading-6 text-slate-600">{mensajeVisible}</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
          {pantallaSeleccionada ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pantalla seleccionada</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {pantallaSeleccionada.screenName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {pantallaSeleccionada.city} / {pantallaSeleccionada.venueType}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-slate-600">
                <p>Coordenadas: {pantallaSeleccionada.latitude}, {pantallaSeleccionada.longitude}</p>
                <p>Dimension: {pantallaSeleccionada.dimensions}</p>
                <p>Impresiones: {formatearImpresiones(pantallaSeleccionada.impressions)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Selecciona una pantalla desde el listado o desde un marcador para inspeccionar su contexto.
            </p>
          )}
        </div>
      </div>
    </Tarjeta>
  )
}