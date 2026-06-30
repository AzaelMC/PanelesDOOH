import { useEffect, useMemo, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'
import {
  generarSnapshotCotizacion,
  obtenerSnapshotCotizacion,
  revocarSnapshotCotizacion
} from '../services/snapshotsApi'

function formatearFecha(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(String(value).replace(' ', 'T'))

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function resolverEstadoSnapshot(snapshot) {
  if (!snapshot) {
    return {
      label: 'Sin liga',
      status: 'inactive',
      descripcion: 'Aun no se ha generado una liga publica para cliente.'
    }
  }

  if (snapshot.revocado) {
    return {
      label: 'Revocada',
      status: 'error',
      descripcion: 'La liga fue revocada y ya no esta disponible para cliente.'
    }
  }

  if (snapshot.expirado) {
    return {
      label: 'Expirada',
      status: 'warning',
      descripcion: 'La liga expiro. Genera una nueva para compartirla otra vez.'
    }
  }

  if (snapshot.vigente) {
    return {
      label: 'Vigente',
      status: 'success',
      descripcion: 'La liga esta activa hasta su fecha de expiracion.'
    }
  }

  return {
    label: 'Sin estado',
    status: 'default',
    descripcion: 'No fue posible determinar el estado actual de la liga.'
  }
}

export default function ControlesSnapshotCliente({ cotizacionId }) {
  const [snapshot, setSnapshot] = useState(null)
  const [urlPublica, setUrlPublica] = useState('')
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const estado = useMemo(() => resolverEstadoSnapshot(snapshot), [snapshot])

  useEffect(() => {
    let active = true

    async function cargarEstado() {
      if (!cotizacionId) {
        setSnapshot(null)
        setCargando(false)
        return
      }

      setCargando(true)
      setError('')

      try {
        const snapshotActual = await obtenerSnapshotCotizacion(cotizacionId)

        if (!active) {
          return
        }

        setSnapshot(snapshotActual)
      } catch (loadError) {
        if (!active) {
          return
        }

        setSnapshot(null)
        setError(loadError.message || 'No fue posible consultar el estado de la liga publica.')
      } finally {
        if (active) {
          setCargando(false)
        }
      }
    }

    cargarEstado()

    return () => {
      active = false
    }
  }, [cotizacionId])

  const handleGenerar = async () => {
    setProcesando(true)
    setError('')
    setMensaje('')
    setUrlPublica('')

    try {
      const response = await generarSnapshotCotizacion(cotizacionId)
      setSnapshot(response.snapshot || null)
      setUrlPublica(response.url_publica || '')
      setMensaje(response.mensaje || 'Liga publica generada correctamente.')
    } catch (saveError) {
      setError(saveError.message || 'No fue posible generar la liga publica.')
    } finally {
      setProcesando(false)
    }
  }

  const handleRevocar = async () => {
    setProcesando(true)
    setError('')
    setMensaje('')
    setUrlPublica('')

    try {
      const response = await revocarSnapshotCotizacion(cotizacionId)
      setSnapshot(response.snapshot || null)
      setMensaje(response.mensaje || 'Liga publica revocada correctamente.')
    } catch (deleteError) {
      setError(deleteError.message || 'No fue posible revocar la liga publica.')
    } finally {
      setProcesando(false)
    }
  }

  const handleCopiar = async () => {
    if (!urlPublica) {
      return
    }

    setError('')

    try {
      await navigator.clipboard.writeText(urlPublica)
      setMensaje('Liga copiada al portapapeles.')
    } catch {
      setError('No fue posible copiar automaticamente. Copia la liga manualmente desde el campo.')
    }
  }

  return (
    <Tarjeta className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Liga para cliente
          </p>
          <h3 className="text-xl font-semibold text-slate-950">Propuesta publica</h3>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Genera una liga temporal para que el cliente visualice las pantallas activas congeladas de esta cotizacion.
            Por seguridad, la URL solo se muestra al generarla o renovarla.
          </p>
        </div>

        <EtiquetaEstado status={estado.status}>{estado.label}</EtiquetaEstado>
      </div>

      {cargando ? (
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Consultando estado de liga publica...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Estado</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{estado.descripcion}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Expira</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{formatearFecha(snapshot?.fecha_expiracion)}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Ultimo acceso</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{formatearFecha(snapshot?.ultimo_acceso)}</p>
          </div>
        </div>
      )}

      {urlPublica && (
        <div className="space-y-3 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Liga generada</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={urlPublica}
              readOnly
              className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none"
              onFocus={(event) => event.target.select()}
            />
            <Boton variant="secondary" onClick={handleCopiar}>
              Copiar liga
            </Boton>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {mensaje}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Boton onClick={handleGenerar} loading={procesando} disabled={cargando || !cotizacionId}>
          Generar / renovar liga
        </Boton>
        <Boton
          variant="danger"
          onClick={handleRevocar}
          loading={procesando}
          disabled={cargando || !snapshot || snapshot.revocado || !cotizacionId}
        >
          Revocar liga
        </Boton>
      </div>
    </Tarjeta>
  )
}
