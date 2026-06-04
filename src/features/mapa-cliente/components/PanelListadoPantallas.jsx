import { FixedSizeList as List } from 'react-window'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

const ALTURA_LISTA = 620
const ALTURA_FILA = 210
const OVERSCAN = 6

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
          className={`w-full cursor-pointer rounded-[24px] border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
            isSelected
              ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{pantalla.screenName}</p>
              <p className={`mt-1 truncate text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {pantalla.city}
              </p>
            </div>
            <EtiquetaEstado status={pantalla.is_active ? 'success' : 'inactive'}>
              {pantalla.is_active ? 'Activa' : 'Inactiva'}
            </EtiquetaEstado>
          </div>

          <div className={`mt-4 grid gap-2 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
            <p className="truncate">{pantalla.venueType}</p>
            <p className="truncate">{pantalla.dimensions}</p>
          </div>

          <div className="mt-4">
            <Boton
              variant={isSelected ? 'secondary' : 'ghost'}
              size="sm"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                seleccionarPantalla(pantalla.id)
                onValidarEntorno()
              }}
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
  onValidarEntorno
}) {
  const itemData = {
    pantallas,
    pantallaSeleccionadaId,
    seleccionarPantalla,
    onValidarEntorno
  }

  return (
    <Tarjeta className="flex h-full flex-col gap-5 overflow-hidden">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Pantallas activas</h3>
        <p className="text-sm text-slate-500">
          Selecciona una pantalla para sincronizar listado y lienzo cartografico.
        </p>
      </div>

      {pantallas.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            No hay pantallas que coincidan con la busqueda actual.
          </p>
        </div>
      ) : (
        <List
          height={ALTURA_LISTA}
          itemCount={pantallas.length}
          itemSize={ALTURA_FILA}
          itemData={itemData}
          overscanCount={OVERSCAN}
          width="100%"
          className="pr-1"
        >
          {FilaPantalla}
        </List>
      )}
    </Tarjeta>
  )
}