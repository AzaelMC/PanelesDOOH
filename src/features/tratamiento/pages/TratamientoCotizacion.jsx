import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AUTH_MOCK_ENABLED } from '../../../config/env'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'
import { useAutenticacion } from '../../autenticacion/context/useAutenticacion'
import BarraOperaciones from '../components/BarraOperaciones'
import CalculosCpmInversion from '../components/CalculosCpmInversion'
import BotonAgregarColumna from '../components/BotonAgregarColumna'
import GrillaTratamiento from '../components/GrillaTratamiento'
import ResumenPresupuesto from '../components/ResumenPresupuesto'
import {
  actualizarCotizacion,
  obtenerCotizacionPorId
} from '../../cotizaciones/services/cotizacionesApi'
import { aplicarOperacionMatematica } from '../utils/aplicarOperacionMatematica'

function formatDate(date) {
  if (!date) {
    return '-'
  }

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsed)
}

function resolverPuedeEditar(usuario, cotizacion) {
  if (!usuario || !cotizacion) {
    return false
  }

  if (usuario.rol === 'administrador') {
    return true
  }

  if (typeof cotizacion.puedeEditar === 'boolean') {
    return cotizacion.puedeEditar
  }

  return String(cotizacion.usuarioCreadorId) === String(usuario.id)
}

function applyCotizacionToState(cotizacion, setCotizacion, setColumnas, setFilas) {
  setCotizacion(cotizacion)
  setColumnas(cotizacion.columnas || [])
  setFilas(cotizacion.ubicaciones || [])
}

function buildOperacionColumnKey(label = '') {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
}

function buildPantallaResumenTexto(cotizacion, filas) {
  const totalPantallas = cotizacion?.totalPantallas || filas.length
  const totalActivas = cotizacion?.totalPantallasActivas || filas.filter((fila) => fila.is_active).length

  return `${totalActivas} activas de ${totalPantallas}`
}

function clonarSnapshotFilas(filas = []) {
  return filas.map((fila) => ({
    ...fila,
    errors: Array.isArray(fila.errors) ? [...fila.errors] : []
  }))
}

function TratamientoCotizacionContenido({ cotizacionId }) {
  const { usuario } = useAutenticacion()
  const [cotizacion, setCotizacion] = useState(null)
  const [columnas, setColumnas] = useState([])
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [hayCambios, setHayCambios] = useState(false)
  const filasOriginalesRef = useRef([])

  useEffect(() => {
    let active = true

    async function cargarCotizacion() {
      setCargando(true)
      setError('')
      setMensajeExito('')
      setHayCambios(false)

      try {
        const detalle = await obtenerCotizacionPorId(cotizacionId)

        if (!active) {
          return
        }

        applyCotizacionToState(detalle, setCotizacion, setColumnas, setFilas)
        filasOriginalesRef.current = clonarSnapshotFilas(detalle.ubicaciones || [])
      } catch (loadError) {
        if (!active) {
          return
        }

        setCotizacion(null)
        setColumnas([])
        setFilas([])
        filasOriginalesRef.current = []
        setError(loadError.message || 'No fue posible cargar la cotizacion.')
      } finally {
        if (active) {
          setCargando(false)
        }
      }
    }

    cargarCotizacion()

    return () => {
      active = false
    }
  }, [cotizacionId])

  const puedeEditar = useMemo(
    () => resolverPuedeEditar(usuario, cotizacion),
    [cotizacion, usuario]
  )

  const columnasNumericas = useMemo(
    () =>
      columnas.filter((columna) =>
        filas.some((fila) => Number.isFinite(Number(fila[columna.key])))
      ),
    [columnas, filas]
  )

  const handleAgregarColumna = ({ key, label }) => {
    setMensajeExito('')
    setHayCambios(true)
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
    setMensajeExito('')
    setHayCambios(true)
    setFilas((current) =>
      current.map((fila) =>
        String(fila.id) === String(rowId)
          ? {
              ...fila,
              is_active: !fila.is_active,
              status: fila.is_active ? 'Inactiva' : 'Lista'
            }
          : fila
      )
    )
  }

  const handleActualizarCelda = (rowId, columnKey, value) => {
    setMensajeExito('')
    setHayCambios(true)
    setFilas((current) =>
      current.map((fila) =>
        String(fila.id) === String(rowId)
          ? { ...fila, [columnKey]: value }
          : fila
      )
    )
  }

  const handleAplicarOperacion = (payload) => {
    const columnaResultadoKey = buildOperacionColumnKey(payload.columnaResultado)

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

    setMensajeExito('')
    setHayCambios(true)
    setFilas(filasActualizadas)
  }

  const handleGuardarCambios = async () => {
    if (!cotizacion || !puedeEditar) {
      return
    }

    setGuardando(true)
    setError('')
    setMensajeExito('')

    try {
      const payload = {
        cotizacion: {
          ...cotizacion,
          columnas,
          totalPantallas: filas.length,
          totalPantallasActivas: filas.filter((fila) => fila.is_active).length
        },
        filasOriginales: filasOriginalesRef.current,
        filasActuales: filas
      }

      const response = await actualizarCotizacion(cotizacion.id || cotizacionId, payload)
      const siguienteCotizacion = response.cotizacion || await obtenerCotizacionPorId(cotizacion.id || cotizacionId)

      applyCotizacionToState(siguienteCotizacion, setCotizacion, setColumnas, setFilas)
      filasOriginalesRef.current = clonarSnapshotFilas(siguienteCotizacion.ubicaciones || [])
      setHayCambios(false)
      setMensajeExito(response.mensaje || 'Cambios guardados correctamente.')
    } catch (saveError) {
      setError(saveError.message || 'No fue posible guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <Tarjeta className="text-center">
        <p className="text-lg font-medium text-slate-900">Cargando cotizacion...</p>
        <p className="mt-2 text-sm text-slate-500">
          Consultando GET /cotizacion.php?id={cotizacionId} para recuperar el tratamiento real.
        </p>
      </Tarjeta>
    )
  }

  if (error && !cotizacion) {
    return (
      <Tarjeta className="space-y-4 text-center">
        <p className="text-lg font-medium text-slate-900">No fue posible abrir la cotizacion.</p>
        <p className="text-sm text-rose-700">{error}</p>
        {!AUTH_MOCK_ENABLED && (
          <p className="text-sm text-slate-500">
            En modo real no se aplica fallback silencioso a mocks.
          </p>
        )}
      </Tarjeta>
    )
  }

  if (!cotizacion) {
    return null
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
                {cotizacion.nombreCampana}
              </h2>
              <p className="text-base text-slate-600">{cotizacion.cliente}</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <EtiquetaEstado status="pending">{cotizacion.estado || 'borrador'}</EtiquetaEstado>
              <Boton
                onClick={handleGuardarCambios}
                loading={guardando}
                disabled={!puedeEditar || !hayCambios}
              >
                Guardar cambios
              </Boton>
            </div>
          </div>

          <dl className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Archivo</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {cotizacion.nombreArchivo || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Hoja</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {cotizacion.nombreHoja || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Pantallas</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {buildPantallaResumenTexto(cotizacion, filas)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Usuario creador</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {cotizacion.usuarioCreadorNombre || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Fecha</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {formatDate(cotizacion.fechaCreacion)}
              </dd>
            </div>
          </dl>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {mensajeExito}
            </div>
          )}
        </Tarjeta>

        <Tarjeta className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-950">Observaciones del flujo</h3>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            <li>La cotizacion se carga desde backend por `cotizacion_id`.</li>
            <li>Las ediciones locales se guardan por lotes, enviando solo los cambios detectados en pantallas.</li>
            <li>{puedeEditar ? 'Tu perfil puede editar esta cotizacion.' : 'Tu perfil solo tiene acceso de lectura en esta cotizacion.'}</li>
          </ul>
        </Tarjeta>
      </section>

      <ResumenPresupuesto filas={filas} columnas={columnas} />

      <CalculosCpmInversion cotizacionId={cotizacion.id || cotizacionId} disabled={!puedeEditar} />

      <section className="grid gap-6 2xl:grid-cols-[1fr_auto]">
        <BarraOperaciones
          columnasNumericas={columnasNumericas}
          onAplicarOperacion={handleAplicarOperacion}
          disabled={!puedeEditar}
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
              disabled={!puedeEditar}
            />
          </Tarjeta>
        </div>
      </section>

      <GrillaTratamiento
        columnas={columnas}
        filas={filas}
        onAlternarFila={handleAlternarFila}
        onActualizarCelda={handleActualizarCelda}
        editable={puedeEditar}
      />
    </div>
  )
}

export default function TratamientoCotizacion() {
  const { cotizacionId = '' } = useParams()

  return <TratamientoCotizacionContenido key={cotizacionId} cotizacionId={cotizacionId} />
}
