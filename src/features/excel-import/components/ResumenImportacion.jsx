import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function ResumenImportacion({
  nombreArchivo = '',
  nombreHoja = '',
  deteccionEncabezados = null,
  resumen = null
}) {
  if (!resumen) {
    return (
      <Tarjeta>
        <p className="py-8 text-center text-slate-500">
          El resumen de importacion aparecera aqui cuando exista un archivo analizado.
        </p>
      </Tarjeta>
    )
  }

  const filaEncabezados = deteccionEncabezados?.indiceFila >= 0
    ? deteccionEncabezados.indiceFila + 1
    : 'No detectada'

  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Resumen de importacion</h3>
        <p className="text-sm text-slate-500">
          Diagnostico rapido del archivo antes de generar la cotizacion temporal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Archivo</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{nombreArchivo || '-'}</p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hoja activa</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{nombreHoja || '-'}</p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fila encabezados</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{filaEncabezados}</p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Columna Maps</p>
          <div className="mt-2">
            <EtiquetaEstado status={resumen.columnaMapsEliminada ? 'warning' : 'default'}>
              {resumen.columnaMapsEliminada ? 'Eliminada' : 'No encontrada'}
            </EtiquetaEstado>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total filas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{resumen.totalFilas}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Procesadas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{resumen.filasProcesadas}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Validas</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{resumen.filasValidas}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invalidas</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">{resumen.filasInvalidas}</p>
        </div>
      </div>
    </Tarjeta>
  )
}
