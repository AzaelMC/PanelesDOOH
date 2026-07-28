import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Boton from '../../../components/ui/Boton'
import { cargarGoogleMaps } from '../../../services/googleMapsLoader'
import { prepararPantallasMapa } from '../utils/prepararPantallasMapa'

const RADIO_BUSQUEDA_STREET_VIEW = 80

function formatearImpresiones(value) {
  return Number.isFinite(value) ? value.toLocaleString('es-MX') : ''
}

export default function ModalStreetViewPlaceholder({ open, pantalla, onClose, cargarMaps = cargarGoogleMaps }) {
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

  const sinCoordenadas = open && pantalla && !pantallaPreparada
  const estadoVisible = sinCoordenadas ? 'error' : estado
  const mensajeVisible = sinCoordenadas ? 'Street View no disponible' : mensajeError

  useEffect(() => {
    if (!open || !pantalla) {
      return undefined
    }

    if (sinCoordenadas || !pantallaPreparada) {
      return undefined
    }

    let cancelado = false
    const streetViewNode = streetViewRef.current

    async function inicializarStreetView() {
      try {
        setEstado('cargando')
        setMensajeError('')

        const maps = await cargarMaps()

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
              setMensajeError('Street View no disponible')
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
      } catch {
        if (!cancelado) {
          setEstado('error')
          setMensajeError('Street View no disponible')
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
  }, [open, pantalla, pantallaPreparada, sinCoordenadas, cargarMaps])

  if (!open || !pantalla) {
    return null
  }

  const detalles = [
    pantalla.screenName ? { label: 'Nombre de pantalla', value: pantalla.screenName } : null,
    pantalla.city ? { label: 'Región', value: pantalla.city } : null,
    pantalla.latitude !== null && pantalla.latitude !== undefined && pantalla.longitude !== null && pantalla.longitude !== undefined
      ? { label: 'Coordenadas', value: `${pantalla.latitude}, ${pantalla.longitude}` }
      : null,
    pantalla.venueType ? { label: 'Tipo de venue', value: pantalla.venueType } : null,
    pantalla.dimensions ? { label: 'Dimensiones', value: pantalla.dimensions } : null,
    formatearImpresiones(pantalla.impressions) ? { label: 'Impresiones', value: formatearImpresiones(pantalla.impressions) } : null
  ].filter(Boolean)

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 py-5 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-[rgba(var(--ntp-purple-brand-rgb),0.18)] bg-white p-5 shadow-[0_30px_65px_-28px_rgba(65,17,137,0.42)] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--ntp-nav-text)]">Street View</p>

          <Boton variant="brandSecondary" onClick={onClose}>
            Cerrar
          </Boton>
        </div>

        <div className="mt-4 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative min-h-[440px] overflow-hidden rounded-[28px] border border-[rgba(var(--ntp-purple-brand-rgb),0.18)] bg-slate-100 shadow-[0_18px_40px_-30px_rgba(var(--ntp-purple-brand-rgb),0.40)] lg:min-h-[470px]">
            <div ref={streetViewRef} className="absolute inset-0" aria-label="Vista interactiva de Google Street View" />

            {(estadoVisible === 'cargando' || estadoVisible === 'idle') && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600 backdrop-blur-sm">
                Cargando Street View
              </div>
            )}

            {(estadoVisible === 'error' || estadoVisible === 'sin-street-view') && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
                <div className="max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
                  <p className="text-base font-semibold text-slate-950">{mensajeVisible}</p>
                </div>
              </div>
            )}
          </div>

          {detalles.length > 0 && (
            <aside className="rounded-[28px] border border-[rgba(var(--ntp-purple-brand-rgb),0.26)] bg-[rgba(var(--ntp-purple-brand-rgb),0.075)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-900">
                Detalle de pantalla
              </p>

              <div className="mt-5 space-y-4 text-sm text-slate-600">
                {detalles.map((detalle) => (
                  <p key={detalle.label}>
                    <span className="block font-semibold text-slate-900">{detalle.label}</span>
                    {detalle.value}
                  </p>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
