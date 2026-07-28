import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'
import { useAutenticacion } from '../../autenticacion/context/useAutenticacion'
import CalculosCpmInversion from '../components/CalculosCpmInversion'
import ControlesLinkCliente from '../../propuesta/components/ControlesLinkCliente'
import GrillaTratamiento from '../components/GrillaTratamiento'
import ResumenPresupuesto from '../components/ResumenPresupuesto'
import {
  actualizarCotizacion,
  obtenerCotizacionPorId
} from '../../cotizaciones/services/cotizacionesApi'
import {
  obtenerStatusEstadoPropuesta,
  obtenerTextoEstadoOperativo,
  obtenerTextoEstadoPropuesta,
  tieneMensajeNuevo
} from '../../cotizaciones/utils/estadoPropuesta'
import { escucharAlertasChat, escucharChatLeido } from '../../chat/utils/eventosChat'

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

function obtenerStatusOperativo(estatus = '') {
  const normalized = String(estatus || '').trim().toLowerCase()

  if (normalized.includes('archiv')) {
    return 'inactive'
  }

  return 'pending'
}

function applyCotizacionToState(cotizacion, setCotizacion, setColumnas, setFilas) {
  setCotizacion(cotizacion)
  setColumnas(cotizacion.columnas || [])
  setFilas(cotizacion.ubicaciones || [])
}

function buildPantallaResumenTexto(cotizacion, filas) {
  const totalPantallas = cotizacion?.totalPantallas || filas.length
  const totalActivas = cotizacion?.totalPantallasActivas || filas.filter((fila) => fila.is_active).length

  return `${totalActivas} activas de ${totalPantallas}`
}

function clonarFilas(filas = []) {
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
        filasOriginalesRef.current = clonarFilas(detalle.ubicaciones || [])
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

  useEffect(() => {
    const limpiarAlertas = escucharAlertasChat(({ alertas = [] }) => {
      const tieneAlerta = (Array.isArray(alertas) ? alertas : []).some(
        (alerta) => String(alerta.cotizacionId || alerta.cotizacion_id) === String(cotizacionId)
      )

      setCotizacion((current) => current
        ? {
            ...current,
            tieneMensajeNuevo: tieneAlerta,
            tiene_mensaje_nuevo: tieneAlerta
          }
        : current)
    })

    const limpiarLeido = escucharChatLeido(({ cotizacionId: cotizacionLeidaId }) => {
      if (String(cotizacionLeidaId) !== String(cotizacionId)) {
        return
      }

      setCotizacion((current) => current
        ? {
            ...current,
            tieneMensajeNuevo: false,
            tiene_mensaje_nuevo: false
          }
        : current)
    })

    return () => {
      limpiarAlertas()
      limpiarLeido()
    }
  }, [cotizacionId])

  const puedeEditar = useMemo(
    () => resolverPuedeEditar(usuario, cotizacion),
    [cotizacion, usuario]
  )

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
      filasOriginalesRef.current = clonarFilas(siguienteCotizacion.ubicaciones || [])
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
        <p className="text-sm font-medium text-rose-700">{error}</p>
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

        <Tarjeta className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-950">Estados</h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estado de cotización</p>
              <EtiquetaEstado status={obtenerStatusOperativo(cotizacion.estatus || cotizacion.estado)}>
                {obtenerTextoEstadoOperativo(cotizacion.estatus || cotizacion.estado)}
              </EtiquetaEstado>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estado de propuesta</p>
              <EtiquetaEstado status={obtenerStatusEstadoPropuesta(cotizacion.estadoPropuesta || cotizacion.estado_propuesta)}>
                {obtenerTextoEstadoPropuesta(cotizacion.estadoPropuesta || cotizacion.estado_propuesta)}
              </EtiquetaEstado>
            </div>

            {tieneMensajeNuevo(cotizacion) && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Chat</p>
                <EtiquetaEstado status="info">Mensaje nuevo</EtiquetaEstado>
              </div>
            )}
          </div>
        </Tarjeta>
      </section>

      <ResumenPresupuesto filas={filas} />

      <CalculosCpmInversion
        cotizacionId={cotizacion.id || cotizacionId}
        presupuestoClienteInicial={cotizacion.presupuestoCliente}
        disabled={!puedeEditar}
      />

      <ControlesLinkCliente cotizacionId={cotizacion.id || cotizacionId} />

      <GrillaTratamiento
        columnas={columnas}
        filas={filas}
        onAlternarFila={handleAlternarFila}
        editable={puedeEditar}
      />
    </div>
  )
}

export default function TratamientoCotizacion() {
  const { cotizacionId = '' } = useParams()

  return <TratamientoCotizacionContenido key={cotizacionId} cotizacionId={cotizacionId} />
}
