import { useEffect, useMemo, useRef, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import { cargarGoogleMaps, tieneGoogleMapsApiKey } from '../../../services/googleMapsLoader'
import { prepararPantallasMapa } from '../utils/prepararPantallasMapa'

const RADIO_BUSQUEDA_STREET_VIEW = 80

export default function ModalStreetViewPlaceholder({ open, pantalla, onClose }) {
  const streetViewRef = useRef(null)
  const panoramaRef = useRef(null)
  const [estado, setEstado] = useState('idle')
  const [mensajeError, setMensajeError] = useState('')

  const pantallaPreparada = useMemo(() => {
    if (!pantalla) {
      return null
    }

    return prepararPantallasMapa([pantalla]).pantallasValidas[0] || null
  }, [pantalla])

  const mensajeConfiguracion = !tieneGoogleMapsApiKey()
    ? 'No se encontro la API key de Google Maps. Revisa VITE_GOOGLE_MAPS_API_KEY en .env.local.'
    : ''

  const mensajeCoordenadas = open && pantalla && !pantallaPreparada
    ? 'Esta pantalla no tiene latitud y longitud validas para abrir Street View.'
    : ''

  const estadoVisible = mensajeConfiguracion
    ? 'error'
    : mensajeCoordenadas
      ? 'error'
      : estado

  const mensajeVisible = mensajeConfiguracion || mensajeCoordenadas || mensajeError

  useEffect(() => {
    if (!open || !pantalla) {
      return undefined
    }

    if (mensajeConfiguracion || mensajeCoordenadas || !pantallaPreparada) {
      return undefined
    }

    let cancelado = false
    const streetViewNode = streetViewRef.current

    async function inicializarStreetView() {
      try {
        setEstado('cargando')
        setMensajeError('')

        const maps = await cargarGoogleMaps()

        if (cancelado || !streetViewNode) {
          return
        }

        const service = new maps.StreetViewService()

        service.getPanorama(
          {
            location: pantallaPreparada.latLng,
            radius: RADIO_BUSQUEDA_STREET_VIEW,
            source: maps.StreetViewSource.DEFAULT
          },
          (data, status) => {
            if (cancelado || !streetViewNode) {
              return
            }

            if (status !== maps.StreetViewStatus.OK || !data?.location?.latLng) {
              setEstado('sin-street-view')
              setMensajeError('No hay Street View disponible para esta ubicacion.')
              return
            }

            panoramaRef.current = new maps.StreetViewPanorama(streetViewNode, {
              position: data.location.latLng,
              pov: {
                heading: 0,
                pitch: 0
              },
              zoom: 1,
              addressControl: true,
              linksControl: true,
              panControl: true,
              fullscreenControl: true,
              motionTracking: false,
              motionTrackingControl: false
            })

            setEstado('listo')
          }
        )
      } catch (error) {
        if (!cancelado) {
          setEstado('error')
          setMensajeError(error.message || 'No se pudo cargar Google Street View.')
        }
      }
    }

    inicializarStreetView()

    return () => {
      cancelado = true
      panoramaRef.current = null
      if (streetViewNode) {
        streetViewNode.innerHTML = ''
      }
    }
  }, [open, pantalla, pantallaPreparada, mensajeConfiguracion, mensajeCoordenadas])

  if (!open || !pantalla) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-[32px] border border-white/60 bg-white p-6 shadow-[0_30px_65px_-28px_rgba(15,23,42,0.55)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
              Street View
            </p>
            <h3 className="text-2xl font-semibold text-slate-950">{pantalla.screenName}</h3>
            <p className="text-sm text-slate-500">{pantalla.city}</p>
          </div>

          <Boton variant="ghost" onClick={onClose}>
            Cerrar
          </Boton>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
            <div ref={streetViewRef} className="absolute inset-0" aria-label="Vista interactiva de Google Street View" />

            {(estadoVisible === 'cargando' || estadoVisible === 'idle') && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600 backdrop-blur-sm">
                Cargando Street View...
              </div>
            )}

            {(estadoVisible === 'error' || estadoVisible === 'sin-street-view') && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
                <div className="max-w-md space-y-3 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
                  <p className="text-base font-semibold text-slate-950">Street View no disponible</p>
                  <p className="text-sm leading-6 text-slate-600">{mensajeVisible}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Detalle de pantalla
            </p>

            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <p>
                <span className="block font-semibold text-slate-900">Coordenadas</span>
                {pantalla.latitude}, {pantalla.longitude}
              </p>
              <p>
                <span className="block font-semibold text-slate-900">Tipo de venue</span>
                {pantalla.venueType || 'Sin dato'}
              </p>
              <p>
                <span className="block font-semibold text-slate-900">Dimensiones</span>
                {pantalla.dimensions || 'Sin dato'}
              </p>
              <p>
                <span className="block font-semibold text-slate-900">Impresiones</span>
                {Number.isFinite(pantalla.impressions) ? pantalla.impressions.toLocaleString('es-MX') : 'Sin dato'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
