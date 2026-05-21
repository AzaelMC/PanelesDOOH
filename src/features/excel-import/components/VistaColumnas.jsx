import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

const CAMPOS_VISUALES = [
  { key: 'screenName', label: 'Screen name', requerido: true },
  { key: 'city', label: 'Site location / City', requerido: false },
  { key: 'venueType', label: 'Venue type', requerido: false },
  { key: 'latitude', label: 'Latitude', requerido: true },
  { key: 'longitude', label: 'Longitude', requerido: true },
  { key: 'dimensions', label: 'Dimension', requerido: false },
  { key: 'impressions', label: 'Impressions', requerido: false },
  { key: 'maps', label: 'Maps', requerido: false }
]

export default function VistaColumnas({
  columnasDetectadas = {},
  mapsEliminada = false
}) {
  const hayAlMenosUna = Object.values(columnasDetectadas).some(Boolean)

  if (!hayAlMenosUna) {
    return (
      <Tarjeta>
        <p className="py-8 text-center text-slate-500">
          Los campos relevantes apareceran aqui cuando el parser detecte encabezados.
        </p>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Columnas detectadas</h3>
        <p className="text-sm text-slate-500">
          Se muestra el encabezado original encontrado para cada campo esperado del flujo DOOH.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CAMPOS_VISUALES.map((campo) => {
          const valor = columnasDetectadas[campo.key]
          const status = valor ? 'success' : campo.requerido ? 'error' : 'warning'

          return (
            <div key={campo.key} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{campo.label}</p>
                <EtiquetaEstado status={status}>
                  {valor ? 'Detectada' : campo.requerido ? 'Falta' : 'Opcional'}
                </EtiquetaEstado>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {valor || 'No encontrada'}
              </p>
              {campo.key === 'maps' && valor && mapsEliminada && (
                <p className="mt-2 text-xs text-amber-700">
                  Detectada y eliminada automaticamente del dataset.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Tarjeta>
  )
}
