import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'
import SelectorUsuarioCotizaciones from './SelectorUsuarioCotizaciones'

export default function FiltrosCotizaciones({
  busqueda,
  usuarioSeleccionado,
  estatusSeleccionado,
  usuarios,
  estatusDisponibles,
  onBusquedaChange,
  onUsuarioChange,
  onEstatusChange
}) {
  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Filtros rapidos</h3>
        <p className="text-sm text-slate-500">
          Busca por campana o cliente y acota por responsable creador o estatus.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

        <CampoTexto
          as="select"
          label="Estatus"
          name="estatus"
          value={estatusSeleccionado}
          onChange={onEstatusChange}
        >
          <option value="">Todos los estatus</option>
          {estatusDisponibles.map((estatus) => (
            <option key={estatus} value={estatus}>
              {estatus}
            </option>
          ))}
        </CampoTexto>
      </div>
    </Tarjeta>
  )
}
