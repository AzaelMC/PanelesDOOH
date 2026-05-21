import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

function renderReadOnlyValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return value
}

export default function GrillaTratamiento({
  columnas = [],
  filas = [],
  onAlternarFila,
  onActualizarCelda
}) {
  const activas = filas.filter((fila) => fila.is_active).length
  const inactivas = filas.length - activas

  return (
    <Tarjeta className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Grilla de tratamiento</h3>
          <p className="mt-1 text-sm text-slate-500">
            Las columnas originales permanecen protegidas; solo las columnas manuales pueden editarse.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <EtiquetaEstado status="success">{activas} activas</EtiquetaEstado>
          <EtiquetaEstado status="inactive">{inactivas} inactivas</EtiquetaEstado>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {columnas.map((columna) => (
                <th key={columna.key} className="px-5 py-4">
                  {columna.label}
                </th>
              ))}
              <th className="px-5 py-4">Activo</th>
              <th className="px-5 py-4 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filas.map((fila) => (
              <tr
                key={fila.id || fila.idTemporal}
                className={`${fila.is_active ? 'opacity-100' : 'bg-slate-50 opacity-45'}`}
              >
                {columnas.map((columna) => (
                  <td
                    key={`${fila.id || fila.idTemporal}-${columna.key}`}
                    className="px-5 py-4 align-top text-sm text-slate-700"
                  >
                    {columna.editable ? (
                      <input
                        type="text"
                        value={fila[columna.key] ?? ''}
                        onChange={(event) =>
                          onActualizarCelda(
                            fila.id || fila.idTemporal,
                            columna.key,
                            event.target.value
                          )}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    ) : (
                      <div className="space-y-1">
                        <span>{renderReadOnlyValue(fila[columna.key])}</span>
                        {columna.key === 'status' && !fila.isValid && fila.errors?.length > 0 && (
                          <p className="max-w-[220px] text-xs leading-5 text-rose-600">
                            {fila.errors.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-5 py-4">
                  <EtiquetaEstado status={fila.is_active ? 'success' : 'inactive'}>
                    {fila.is_active ? 'Activa' : 'Inactiva'}
                  </EtiquetaEstado>
                </td>
                <td className="px-5 py-4 text-right">
                  <Boton
                    variant="ghost"
                    size="sm"
                    onClick={() => onAlternarFila(fila.id || fila.idTemporal)}
                  >
                    {fila.is_active ? 'Desactivar' : 'Reactivar'}
                  </Boton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  )
}
