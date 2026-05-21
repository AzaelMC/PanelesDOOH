import { useMemo, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

const CAMPOS_ESPERADOS = [
  { key: 'screenName', label: 'Screen name' },
  { key: 'city', label: 'City' },
  { key: 'venueType', label: 'Venue type' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'dimensions', label: 'Dimension' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'maps', label: 'Maps' }
]

const ETIQUETAS_MOTIVO = {
  coincidencia_exacta: 'Coincidencia exacta Inventory - Screens',
  coincidencia_normalizada: 'Coincidencia normalizada Inventory - Screens',
  screens_priorizada: 'Hoja Screens priorizada por columnas clave',
  variante_preferida: 'Variante preferida por nombre y columnas',
  mejor_score_encabezados: 'Mejor score de encabezados',
  seleccion_manual: 'Seleccion manual de hoja',
  primera_hoja_con_datos: 'Primera hoja con datos',
  sin_hojas: 'Sin hojas',
  sin_hojas_con_datos: 'Sin hojas con datos'
}

function construirErroresFrecuentes(ubicacionesInvalidas = []) {
  const contador = new Map()

  ubicacionesInvalidas.forEach((ubicacion) => {
    ;(ubicacion.errors || []).forEach((error) => {
      contador.set(error, (contador.get(error) || 0) + 1)
    })
  })

  return [...contador.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([error, total]) => ({ error, total }))
}

export default function DiagnosticoParser({
  nombreArchivo = '',
  hojas = [],
  deteccionHoja = null,
  deteccionEncabezados = null,
  columnasDetectadas = {},
  resumen = null,
  ubicacionesInvalidas = []
}) {
  const [open, setOpen] = useState(false)

  const columnasDetectadasLista = useMemo(
    () =>
      CAMPOS_ESPERADOS.filter((campo) => Boolean(columnasDetectadas[campo.key])).map((campo) => ({
        ...campo,
        valor: columnasDetectadas[campo.key]
      })),
    [columnasDetectadas]
  )

  const columnasFaltantes = useMemo(
    () => CAMPOS_ESPERADOS.filter((campo) => !columnasDetectadas[campo.key]).map((campo) => campo.label),
    [columnasDetectadas]
  )

  const erroresFrecuentes = useMemo(
    () => construirErroresFrecuentes(ubicacionesInvalidas),
    [ubicacionesInvalidas]
  )

  if (!nombreArchivo && !resumen) {
    return null
  }

  const motivo = ETIQUETAS_MOTIVO[deteccionHoja?.motivo] || 'Analisis tecnico disponible'

  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <Boton variant="secondary" size="sm" onClick={() => setOpen((current) => !current)}>
          {open ? 'Ocultar diagnostico tecnico' : 'Ver diagnostico tecnico'}
        </Boton>
      </div>

      {open && (
        <Tarjeta className="space-y-5 border-slate-300 bg-slate-50/80">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-950">Diagnostico tecnico del parser</h3>
            <p className="text-sm text-slate-500">
              Vista de apoyo para QA con archivos reales del proveedor. No afecta el flujo operativo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Archivo</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{nombreArchivo || '-'}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hoja detectada</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{deteccionHoja?.nombreHoja || '-'}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Motivo</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{motivo}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total hojas</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{hojas.length}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fila encabezados</p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {deteccionEncabezados?.indiceFila >= 0 ? deteccionEncabezados.indiceFila + 1 : 'No detectada'}
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score encabezados</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{deteccionEncabezados?.score || 0}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Maps eliminada</p>
              <div className="mt-2">
                <EtiquetaEstado status={resumen?.columnaMapsEliminada ? 'warning' : 'default'}>
                  {resumen?.columnaMapsEliminada ? 'Si' : 'No'}
                </EtiquetaEstado>
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Filas procesadas</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{resumen?.filasProcesadas || 0}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Validas</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{resumen?.filasValidas || 0}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invalidas</p>
              <p className="mt-2 text-2xl font-semibold text-rose-700">{resumen?.filasInvalidas || 0}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Columnas faltantes</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{columnasFaltantes.length}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Columnas detectadas</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {columnasDetectadasLista.length > 0 ? (
                  columnasDetectadasLista.map((columna) => (
                    <li key={columna.key}>
                      <span className="font-medium text-slate-900">{columna.label}:</span> {columna.valor}
                    </li>
                  ))
                ) : (
                  <li>No se detectaron columnas relevantes.</li>
                )}
              </ul>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Columnas faltantes</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {columnasFaltantes.length > 0 ? (
                  columnasFaltantes.map((columna) => <li key={columna}>{columna}</li>)
                ) : (
                  <li>No hay columnas faltantes.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Errores mas frecuentes</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {erroresFrecuentes.length > 0 ? (
                erroresFrecuentes.map((item) => (
                  <li key={item.error}>
                    <span className="font-medium text-slate-900">{item.error}</span> ({item.total})
                  </li>
                ))
              ) : (
                <li>Sin errores frecuentes detectados.</li>
              )}
            </ul>
          </div>
        </Tarjeta>
      )}
    </div>
  )
}
