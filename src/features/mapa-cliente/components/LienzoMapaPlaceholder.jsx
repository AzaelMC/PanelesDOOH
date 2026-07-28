import { useEffect, useMemo, useRef, useState } from 'react'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cargarGoogleMaps, cargarGoogleMapsMarker, obtenerGoogleMapsConfig } from '../../../services/googleMapsLoader'
import { prepararPantallasMapa } from '../utils/prepararPantallasMapa'

const ZOOM_MAXIMO_INICIAL = 13
const ZOOM_SELECCION = 16
const NTP_PURPLE = '#9E6DF7'

const MAPA_INICIAL = {
  center: { lat: 23.6345, lng: -102.5528 },
  zoom: 5,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: false,
  scrollwheel: false,
  gestureHandling: 'greedy'
}

function crearContenidoMarcador({ selected = false } = {}) {
  const contenedor = document.createElement('div')
  contenedor.style.position = 'relative'
  contenedor.style.width = selected ? '48px' : '42px'
  contenedor.style.height = selected ? '58px' : '52px'
  contenedor.style.transform = selected ? 'scale(1.08)' : 'scale(1)'
  contenedor.style.transformOrigin = 'center bottom'
  contenedor.style.cursor = 'pointer'
  contenedor.style.filter = selected
    ? 'drop-shadow(0 12px 18px rgba(65,17,137,0.36))'
    : 'drop-shadow(0 8px 14px rgba(65,17,137,0.24))'

  const size = selected ? 48 : 42
  const height = selected ? 58 : 52
  const center = size / 2
  const circleY = selected ? 22 : 20
  const circleR = selected ? 8 : 7
  const dotR = selected ? 3.6 : 3.2

  const svgWrapper = document.createElement('div')
  svgWrapper.innerHTML = `
    <svg width="${size}" height="${height}" viewBox="0 0 ${size} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M${center} 2.5C${center - 11.5} 2.5 ${center - 20} 11 ${center - 20} ${circleY + 1}C${center - 20} ${circleY + 16} ${center} ${height - 3} ${center} ${height - 3}C${center} ${height - 3} ${center + 20} ${circleY + 16} ${center + 20} ${circleY + 1}C${center + 20} 11 ${center + 11.5} 2.5 ${center} 2.5Z" fill="${NTP_PURPLE}" stroke="white" stroke-width="4"/>
      <circle cx="${center}" cy="${circleY}" r="${circleR}" fill="white"/>
      <circle cx="${center}" cy="${circleY}" r="${dotR}" fill="${NTP_PURPLE}"/>
    </svg>
  `

  contenedor.appendChild(svgWrapper)

  return contenedor
}


function crearContenidoCluster(count) {
  const contenedor = document.createElement('div')
  contenedor.style.width = '48px'
  contenedor.style.height = '48px'
  contenedor.style.borderRadius = '999px'
  contenedor.style.background = NTP_PURPLE
  contenedor.style.color = 'white'
  contenedor.style.display = 'flex'
  contenedor.style.alignItems = 'center'
  contenedor.style.justifyContent = 'center'
  contenedor.style.fontWeight = '800'
  contenedor.style.fontSize = count > 99 ? '0.78rem' : '0.95rem'
  contenedor.style.border = '4px solid rgba(255,255,255,0.92)'
  contenedor.style.boxShadow = '0 16px 30px -18px rgba(65,17,137,0.65)'
  contenedor.textContent = String(count)

  return contenedor
}

function formatearImpresiones(value) {
  if (!Number.isFinite(value)) {
    return ''
  }

  return value.toLocaleString('es-MX')
}

function aplicarEstiloMarcador(markerData, selected) {
  if (!markerData?.marker) {
    return
  }

  markerData.marker.content = crearContenidoMarcador({ selected })
  markerData.marker.zIndex = selected ? 20 : 10
}

export default function LienzoMapaPlaceholder({
  pantallas,
  pantallaSeleccionada,
  seleccionarPantalla,
  centrarSeleccion = false,
  cargarMaps = cargarGoogleMaps,
  cargarMarker = cargarGoogleMapsMarker,
  obtenerMapsConfig = obtenerGoogleMapsConfig
}) {
  const mapaRef = useRef(null)
  const instanciaMapaRef = useRef(null)
  const mapsRef = useRef(null)
  const markerLibraryRef = useRef(null)
  const clustererRef = useRef(null)
  const marcadoresRef = useRef(new Map())
  const pantallaSeleccionadaAnteriorRef = useRef(null)
  const [mapaListo, setMapaListo] = useState(false)
  const [estado, setEstado] = useState('idle')
  const [mensajeError, setMensajeError] = useState('')

  const { pantallasValidas, pantallasInvalidas } = useMemo(() => {
    return prepararPantallasMapa(pantallas)
  }, [pantallas])

  const estadoVisible = pantallasValidas.length === 0
    ? 'sin-coordenadas'
    : estado

  const mensajeVisible = estadoVisible === 'sin-coordenadas'
    ? 'Sin coordenadas'
    : mensajeError

  const pantallaSeleccionadaPreparada = useMemo(() => {
    if (!pantallaSeleccionada) {
      return null
    }

    return prepararPantallasMapa([pantallaSeleccionada]).pantallasValidas[0] || null
  }, [pantallaSeleccionada])

  useEffect(() => {
    let cancelado = false

    async function inicializarMapa() {
      try {
        setEstado('cargando')
        setMensajeError('')

        const [maps, markerLibrary, mapsConfig] = await Promise.all([
          cargarMaps(),
          cargarMarker(),
          obtenerMapsConfig()
        ])

        if (cancelado || !mapaRef.current) {
          return
        }

        mapsRef.current = maps
        markerLibraryRef.current = markerLibrary

        if (!instanciaMapaRef.current) {
          instanciaMapaRef.current = new maps.Map(mapaRef.current, {
            ...MAPA_INICIAL,
            mapId: mapsConfig.mapId,
            zoomControlOptions: {
              position: maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControlOptions: {
              position: maps.ControlPosition.LEFT_BOTTOM
            }
          })
        }

        setMapaListo(true)
        setEstado('listo')
      } catch {
        if (!cancelado) {
          setEstado('error')
          setMensajeError('No se pudo cargar el mapa')
        }
      }
    }

    inicializarMapa()

    return () => {
      cancelado = true
    }
  }, [cargarMaps, cargarMarker, obtenerMapsConfig])

  useEffect(() => {
    if (!mapaListo || !instanciaMapaRef.current || !mapsRef.current || !markerLibraryRef.current) {
      return undefined
    }

    const map = instanciaMapaRef.current
    const maps = mapsRef.current
    const markerLibrary = markerLibraryRef.current

    clustererRef.current?.clearMarkers()
    clustererRef.current = null

    marcadoresRef.current.forEach(({ marker }) => {
      marker.map = null
    })
    marcadoresRef.current.clear()
    pantallaSeleccionadaAnteriorRef.current = null

    if (pantallasValidas.length === 0) {
      return undefined
    }

    const bounds = new maps.LatLngBounds()

    const markers = []

    pantallasValidas.forEach((pantalla) => {
      bounds.extend(pantalla.latLng)

      const marker = new markerLibrary.AdvancedMarkerElement({
        position: pantalla.latLng,
        title: pantalla.screenName,
        content: crearContenidoMarcador({ selected: false }),
        zIndex: 10,
        gmpClickable: true
      })

      marker.addEventListener('gmp-click', () => seleccionarPantalla(pantalla.id))

      markers.push(marker)

      marcadoresRef.current.set(pantalla.id, {
        marker,
        pantalla
      })
    })

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: {
        render: ({ count, position }) => new markerLibrary.AdvancedMarkerElement({
          position,
          content: crearContenidoCluster(count),
          zIndex: 30 + count,
          title: `${count} pantallas`
        })
      }
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

    return undefined
  }, [mapaListo, pantallasValidas, seleccionarPantalla])

  useEffect(() => {
    if (!mapaListo || !instanciaMapaRef.current) {
      return
    }

    const markerAnteriorId = pantallaSeleccionadaAnteriorRef.current

    if (markerAnteriorId && markerAnteriorId !== pantallaSeleccionadaPreparada?.id) {
      aplicarEstiloMarcador(marcadoresRef.current.get(markerAnteriorId), false)
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

    aplicarEstiloMarcador(markerActual, true)
    pantallaSeleccionadaAnteriorRef.current = pantallaSeleccionadaPreparada.id

    if (centrarSeleccion) {
      instanciaMapaRef.current.panTo(pantallaSeleccionadaPreparada.latLng)
      instanciaMapaRef.current.setZoom(ZOOM_SELECCION)
    }
  }, [mapaListo, pantallaSeleccionadaPreparada, centrarSeleccion])

  useEffect(() => {
    const marcadores = marcadoresRef.current

    return () => {
      clustererRef.current?.clearMarkers()
      clustererRef.current = null

      marcadores.forEach(({ marker }) => {
        marker.map = null
      })
      marcadores.clear()
    }
  }, [])

  return (
    <Tarjeta className="flex h-full min-h-[620px] flex-col gap-5">
      {pantallasInvalidas.length > 0 && (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sin coordenadas: {pantallasInvalidas.length}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-[28px] border border-[rgba(var(--ntp-purple-brand-rgb),0.16)] bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <div ref={mapaRef} className="absolute inset-0" aria-label="Mapa de ubicaciones DOOH" />

        {(estadoVisible === 'cargando' || estadoVisible === 'idle') && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600 backdrop-blur-sm">
            Cargando mapa
          </div>
        )}

        {(estadoVisible === 'error' || estadoVisible === 'sin-coordenadas') && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
            <div className="max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
              <p className="text-base font-semibold text-slate-950">{mensajeVisible}</p>
            </div>
          </div>
        )}

        {pantallaSeleccionada && (
          <div className="absolute left-4 right-4 top-4 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] backdrop-blur sm:left-6 sm:right-6 sm:top-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pantalla seleccionada</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {pantallaSeleccionada.screenName}
                </p>
                {(pantallaSeleccionada.city || pantallaSeleccionada.venueType) && (
                  <p className="mt-1 text-sm text-slate-600">
                    {[pantallaSeleccionada.city, pantallaSeleccionada.venueType].filter(Boolean).join(' / ')}
                  </p>
                )}
              </div>

              <div className="grid gap-2 text-sm text-slate-600">
                <p>Coordenadas: {pantallaSeleccionada.latitude}, {pantallaSeleccionada.longitude}</p>
                {pantallaSeleccionada.dimensions ? <p>Dimension: {pantallaSeleccionada.dimensions}</p> : null}
                {formatearImpresiones(pantallaSeleccionada.impressions) ? (
                  <p>Impresiones: {formatearImpresiones(pantallaSeleccionada.impressions)}</p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
