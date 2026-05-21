import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

function renderValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return value
}

export default function TablaVistaUbicaciones({ ubicaciones = [] }) {
  if (!ubicaciones.length) {
    return null
  }

  const visibles = ubicaciones.slice(0, 20)

  return (
    <Tarjeta className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-950">Vista previa de ubicaciones</h3>
        <p className="mt-1 text-sm text-slate-500">
          Se muestran hasta 20 registros para validar rapidamente el parseo antes de continuar.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Screen name</th>
              <th className="px-5 py-4">City</th>
              <th className="px-5 py-4">Venue type</th>
              <th className="px-5 py-4">Latitude</th>
              <th className="px-5 py-4">Longitude</th>
              <th className="px-5 py-4">Cardinal point</th>
              <th className="px-5 py-4">Dimensions</th>
              <th className="px-5 py-4">Impressions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {visibles.map((ubicacion) => (
              <tr key={ubicacion.idTemporal}>
                <td className="px-5 py-4 align-top">
                  <div className="space-y-2">
                    <EtiquetaEstado status={ubicacion.isValid ? 'success' : 'error'}>
                      {ubicacion.isValid ? 'Valida' : 'Invalida'}
                    </EtiquetaEstado>
                    {!ubicacion.isValid && ubicacion.errors.length > 0 && (
                      <p className="max-w-[220px] text-xs leading-5 text-rose-600">
                        {ubicacion.errors.join(', ')}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.screenName)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.city)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.venueType)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.latitude)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.longitude)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.cardinalPoint)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(ubicacion.dimensions)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {Number.isFinite(ubicacion.impressions)
                    ? ubicacion.impressions.toLocaleString('es-MX')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  )
}
