import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function PanelListadoPantallas({
  pantallas,
  pantallaSeleccionadaId,
  seleccionarPantalla,
  onValidarEntorno
}) {
  const manejarTeclaPantalla = (event, pantallaId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      seleccionarPantalla(pantallaId)
    }
  }

  return (
    <Tarjeta className="flex h-full flex-col gap-5 overflow-hidden">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Pantallas activas</h3>
        <p className="text-sm text-slate-500">
          Selecciona una pantalla para sincronizar listado y lienzo cartografico.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {pantallas.map((pantalla) => {
          const isSelected = pantalla.id === pantallaSeleccionadaId

          return (
            <div
              key={pantalla.id}
              role="button"
              tabIndex={0}
              onClick={() => seleccionarPantalla(pantalla.id)}
              onKeyDown={(event) => manejarTeclaPantalla(event, pantalla.id)}
              className={`w-full cursor-pointer rounded-[24px] border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                isSelected
                  ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{pantalla.screenName}</p>
                  <p className={`mt-1 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {pantalla.city}
                  </p>
                </div>
                <EtiquetaEstado status={pantalla.is_active ? 'success' : 'inactive'}>
                  {pantalla.is_active ? 'Activa' : 'Inactiva'}
                </EtiquetaEstado>
              </div>

              <div className={`mt-4 grid gap-2 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                <p>{pantalla.venueType}</p>
                <p>{pantalla.dimensions}</p>
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
          )
        })}
      </div>
    </Tarjeta>
  )
}