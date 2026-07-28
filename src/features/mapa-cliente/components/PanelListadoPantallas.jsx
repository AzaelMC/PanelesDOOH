import { useEffect, useRef, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

const ALTURA_LISTA_MINIMA = 240
const ALTURA_LISTA_FALLBACK = 620
const ALTURA_FILA = 172
const OVERSCAN = 6

function IconoPantalla({ selected = false }) {
  return (
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition ${
        selected
          ? 'border-white/35 bg-white/[0.14] text-white'
          : 'border-[#9E6DF7]/25 bg-white text-[#9E6DF7]'
      }`}
      aria-hidden="true"
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <rect
          x="6.5"
          y="6.5"
          width="21"
          height="17"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path
          d="M13.5 28H20.5M17 23.5V28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M10.5 19L15.2 14.3L18.2 17.3L22.8 12.7"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function FilaPantalla({ index, style, data }) {
  const {
    pantallas,
    pantallaSeleccionadaId,
    seleccionarPantalla,
    onValidarEntorno
  } = data

  const pantalla = pantallas[index]
  const isSelected = pantalla.id === pantallaSeleccionadaId

  const manejarTeclaPantalla = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      seleccionarPantalla(pantalla.id)
    }
  }

  return (
    <div style={style} className="pr-1">
      <div className="pb-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => seleccionarPantalla(pantalla.id)}
          onKeyDown={manejarTeclaPantalla}
          className={`w-full cursor-pointer rounded-[22px] border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#9E6DF7] focus:ring-offset-2 ${
            isSelected
              ? 'border-[#9E6DF7] bg-[#9E6DF7] text-white shadow-[0_18px_34px_-22px_rgba(158,109,247,0.78)]'
              : 'border-[rgba(158,109,247,0.18)] bg-white/90 text-slate-950 shadow-[0_14px_28px_-24px_rgba(158,109,247,0.28)] hover:border-[rgba(158,109,247,0.34)] hover:bg-white'
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <EtiquetaEstado status={pantalla.is_active ? 'success' : 'inactive'} className="px-2 py-0.5 text-[0.62rem]">
              {pantalla.is_active ? 'Activa' : 'Inactiva'}
            </EtiquetaEstado>
          </div>

          <div className="flex gap-3">
            <IconoPantalla selected={isSelected} />

            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                {pantalla.screenName}
              </p>
              {pantalla.city ? (
                <p className={`mt-1 truncate text-xs ${isSelected ? 'text-white/70' : 'text-slate-600'}`}>
                  {pantalla.city}
                </p>
              ) : null}
              {(pantalla.venueType || pantalla.dimensions) && (
                <p className={`mt-1 truncate text-xs ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                  {[pantalla.venueType, pantalla.dimensions].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3">
            <Boton
              variant={isSelected ? 'secondary' : 'brandSecondary'}
              size="sm"
              fullWidth
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                seleccionarPantalla(pantalla.id)
                onValidarEntorno()
              }}
              className={isSelected ? 'border-white/45 bg-white text-[#9E6DF7] hover:bg-white/95' : ''}
            >
              Validar entorno
            </Boton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PanelListadoPantallas({
  pantallas,
  pantallaSeleccionadaId,
  seleccionarPantalla,
  onValidarEntorno,
  className = ''
}) {
  const listaRef = useRef(null)
  const contenedorListaRef = useRef(null)
  const [alturaLista, setAlturaLista] = useState(ALTURA_LISTA_FALLBACK)


  useEffect(() => {
    const contenedor = contenedorListaRef.current

    if (!contenedor || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const actualizarAltura = () => {
      const siguienteAltura = Math.max(
        ALTURA_LISTA_MINIMA,
        Math.floor(contenedor.getBoundingClientRect().height)
      )

      setAlturaLista(siguienteAltura)
    }

    actualizarAltura()

    const observer = new ResizeObserver(actualizarAltura)
    observer.observe(contenedor)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!pantallaSeleccionadaId || pantallas.length === 0) {
      return
    }

    const pantallaSeleccionadaIndex = pantallas.findIndex(
      (pantalla) => pantalla.id === pantallaSeleccionadaId
    )

    if (pantallaSeleccionadaIndex < 0) {
      return
    }

    listaRef.current?.scrollToItem(pantallaSeleccionadaIndex, 'smart')
  }, [pantallas, pantallaSeleccionadaId])

  const itemData = {
    pantallas,
    pantallaSeleccionadaId,
    seleccionarPantalla,
    onValidarEntorno
  }

  return (
    <Tarjeta className={`flex h-full min-h-[620px] flex-col overflow-hidden p-4 ${className}`}>
      {pantallas.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-[rgba(158,109,247,0.26)] bg-white/70 p-6 text-center">
          <p className="text-sm text-slate-500">Sin pantallas</p>
        </div>
      ) : (
        <div ref={contenedorListaRef} className="min-h-0 flex-1">
          <List
            ref={listaRef}
            height={alturaLista}
            itemCount={pantallas.length}
            itemSize={ALTURA_FILA}
            itemData={itemData}
            overscanCount={OVERSCAN}
            width="100%"
            className="pr-1"
          >
            {FilaPantalla}
          </List>
        </div>
      )}
    </Tarjeta>
  )
}
