import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'
import SelectorUsuarioCotizaciones from './SelectorUsuarioCotizaciones'

export default function FiltrosCotizaciones({
  busqueda,
  usuarioSeleccionado,
  usuarios,
  onBusquedaChange,
  onUsuarioChange
}) {
  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Filtros rapidos</h3>
        <p className="text-sm text-slate-500">
          Busca por campana o cliente y acota por responsable creador.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <CampoTexto
          label="Campana o cliente"
          name="busqueda"
          placeholder="Ej. Aurea, Capital Retail, Demo"
          value={busqueda}
          onChange={onBusquedaChange}
        />

        <SelectorUsuarioCotizaciones
          value={usuarioSeleccionado}
          usuarios={usuarios}
          onChange={onUsuarioChange}
        />
      </div>
    </Tarjeta>
  )
}
