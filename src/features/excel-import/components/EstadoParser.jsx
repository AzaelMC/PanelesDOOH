import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function EstadoParser({
  nombreArchivo,
  hojas,
  cargando,
  error,
  resumen
}) {
  if (cargando) {
    return (
      <Tarjeta className="space-y-3">
        <EtiquetaEstado status="pending">Leyendo archivo</EtiquetaEstado>
        <p className="text-sm text-slate-600">
          Analizando hojas, encabezados y columnas relevantes del inventario.
        </p>
      </Tarjeta>
    )
  }

  if (error) {
    return (
      <Tarjeta className="space-y-3 border-rose-200 bg-rose-50">
        <EtiquetaEstado status="error">Error</EtiquetaEstado>
        <p className="text-sm text-rose-700">{error}</p>
      </Tarjeta>
    )
  }

  if (!nombreArchivo) {
    return (
      <Tarjeta className="space-y-3">
        <EtiquetaEstado status="default">Sin archivo cargado</EtiquetaEstado>
        <p className="text-sm text-slate-600">
          Carga un Excel o CSV para comenzar el analisis de inventario DOOH.
        </p>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <EtiquetaEstado status="success">Archivo procesado</EtiquetaEstado>
          <p className="text-sm font-medium text-slate-900">{nombreArchivo}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Hojas</p>
          <p className="text-xl font-semibold text-slate-950">{hojas.length}</p>
        </div>
      </div>

      {resumen && (
        <p className="text-sm text-slate-600">
          {resumen.filasProcesadas} filas procesadas, {resumen.filasValidas} validas y {resumen.filasInvalidas} con revision.
        </p>
      )}
    </Tarjeta>
  )
}
