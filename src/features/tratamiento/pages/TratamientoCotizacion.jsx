import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cotizacionesMock } from '../../cotizaciones/data/cotizacionesMock'
import BarraOperaciones from '../components/BarraOperaciones'
import BotonAgregarColumna from '../components/BotonAgregarColumna'
import GrillaTratamiento from '../components/GrillaTratamiento'
import ResumenPresupuesto from '../components/ResumenPresupuesto'
import { tratamientoCotizacionMock } from '../data/tratamientoCotizacionMock'
import { aplicarOperacionMatematica } from '../utils/aplicarOperacionMatematica'
import { eliminarColumnaMaps } from '../utils/eliminarColumnaMaps'

const STORAGE_KEY = 'dooh_cotizacion_temporal'

function compactarFilaTemporal(fila = {}) {
  const filaCompacta = { ...fila }
  delete filaCompacta.rawPayload
  return filaCompacta
}

function buildFallbackCotizacion(cotizacionId) {
  const cotizacion = cotizacionesMock.find((item) => item.id === cotizacionId) || cotizacionesMock[0]
  const limpieza = eliminarColumnaMaps(
    tratamientoCotizacionMock.columnas,
    tratamientoCotizacionMock.filas
  )

  return {
    cotizacion: {
      ...cotizacion,
      nombreArchivo: 'demo-operativo.xlsx',
      nombreHoja: 'Inventory - Screens',
      usuarioCreadorNombre: cotizacion.usuarioCreadorNombre || 'Sesion actual',
      notasInternas: '',
      totalPantallas: limpieza.filasLimpias.length
    },
    columnas: limpieza.columnasLimpias,
    filas: limpieza.filasLimpias.map((fila) => ({
      ...fila,
      id: fila.id || fila.idTemporal
    })),
    esTemporal: false
  }
}

function buildTemporalState(cotizacionTemporal) {
  return {
    cotizacion: {
      ...cotizacionTemporal,
      usuarioCreadorNombre: cotizacionTemporal.usuarioCreadorNombre || 'Sesion actual'
    },
    columnas: cotizacionTemporal.columnas || [],
    filas: (cotizacionTemporal.ubicaciones || []).map((ubicacion) => ({
      ...compactarFilaTemporal(ubicacion),
      id: ubicacion.id || ubicacion.idTemporal
    })),
    esTemporal: true
  }
}

function obtenerCotizacionTemporalStorage() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function buildSourceState(cotizacionId) {
  const temporal = obtenerCotizacionTemporalStorage()

  if (temporal?.id === cotizacionId) {
    return buildTemporalState(temporal)
  }

  return buildFallbackCotizacion(cotizacionId)
}

function TratamientoCotizacionContenido({ cotizacionId }) {
  const [sourceState] = useState(() => buildSourceState(cotizacionId))
  const [columnas, setColumnas] = useState(sourceState.columnas)
  const [filas, setFilas] = useState(sourceState.filas)

  useEffect(() => {
    if (!sourceState.esTemporal) {
      return
    }

    const temporal = obtenerCotizacionTemporalStorage()

    if (!temporal || temporal.id !== cotizacionId) {
      return
    }

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...temporal,
        columnas,
        ubicaciones: filas.map(compactarFilaTemporal),
        totalPantallas: filas.length,
        totalPantallasActivas: filas.filter((fila) => fila.is_active).length
      })
    )
  }, [columnas, filas, cotizacionId, sourceState.esTemporal])

  const columnasNumericas = useMemo(
    () =>
      columnas.filter((columna) =>
        filas.some((fila) => Number.isFinite(Number(fila[columna.key])))
      ),
    [columnas, filas]
  )

  const handleAgregarColumna = ({ key, label }) => {
    setColumnas((current) => [
      ...current,
      {
        key,
        label,
        editable: true,
        origen: 'manual'
      }
    ])

    setFilas((current) =>
      current.map((fila) => ({
        ...fila,
        [key]: ''
      }))
    )
  }

  const handleAlternarFila = (rowId) => {
    setFilas((current) =>
      current.map((fila) =>
        fila.id === rowId
          ? { ...fila, is_active: !fila.is_active }
          : fila
      )
    )
  }

  const handleActualizarCelda = (rowId, columnKey, value) => {
    setFilas((current) =>
      current.map((fila) =>
        fila.id === rowId
          ? { ...fila, [columnKey]: value }
          : fila
      )
    )
  }

  const handleAplicarOperacion = (payload) => {
    const columnaResultadoKey = payload.columnaResultado
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')

    if (!columnaResultadoKey) {
      return
    }

    const filasActualizadas = aplicarOperacionMatematica({
      ...payload,
      filas,
      columnaResultado: columnaResultadoKey
    })

    if (!columnas.some((columna) => columna.key === columnaResultadoKey)) {
      setColumnas((current) => [
        ...current,
        {
          key: columnaResultadoKey,
          label: payload.columnaResultado.trim(),
          editable: false,
          origen: 'calculada'
        }
      ])
    }

    setFilas(filasActualizadas)
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Tarjeta className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
                Tratamiento operativo
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
                {sourceState.cotizacion.nombreCampana}
              </h2>
              <p className="text-base text-slate-600">{sourceState.cotizacion.cliente}</p>
            </div>

            <EtiquetaEstado status="pending">{sourceState.cotizacion.estado || 'borrador'}</EtiquetaEstado>
          </div>

          <dl className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Archivo</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {sourceState.cotizacion.nombreArchivo || 'demo-operativo.xlsx'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Hoja</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {sourceState.cotizacion.nombreHoja || 'Inventory - Screens'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Pantallas</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">{filas.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Usuario creador</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {sourceState.cotizacion.usuarioCreadorNombre}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Fecha</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {new Intl.DateTimeFormat('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).format(new Date(sourceState.cotizacion.fechaCreacion))}
              </dd>
            </div>
          </dl>
        </Tarjeta>

        <Tarjeta className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-950">Observaciones del flujo</h3>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            <li>Si existe una cotizacion temporal en sessionStorage y coincide con la ruta, se prioriza esa fuente.</li>
            <li>La columna Maps ya fue eliminada antes de llegar a esta grilla.</li>
            <li>Las columnas manuales y calculadas se mantienen solo en estado temporal frontend.</li>
          </ul>
        </Tarjeta>
      </section>

      <ResumenPresupuesto filas={filas} columnas={columnas} />

      <section className="grid gap-6 2xl:grid-cols-[1fr_auto]">
        <BarraOperaciones
          columnasNumericas={columnasNumericas}
          onAplicarOperacion={handleAplicarOperacion}
        />
        <div className="2xl:min-w-[320px]">
          <Tarjeta className="h-full space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-950">Curaduria de columnas</h3>
              <p className="text-sm text-slate-500">
                Agrega columnas manuales para observaciones o calculos operativos sin tocar el archivo fuente.
              </p>
            </div>
            <BotonAgregarColumna
              columnasExistentes={columnas}
              onAgregarColumna={handleAgregarColumna}
            />
          </Tarjeta>
        </div>
      </section>

      <GrillaTratamiento
        columnas={columnas}
        filas={filas}
        onAlternarFila={handleAlternarFila}
        onActualizarCelda={handleActualizarCelda}
      />
    </div>
  )
}

export default function TratamientoCotizacion() {
  const { cotizacionId = '' } = useParams()

  return <TratamientoCotizacionContenido key={cotizacionId} cotizacionId={cotizacionId} />
}
