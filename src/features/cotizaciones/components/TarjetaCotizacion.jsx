import { Link } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

function obtenerStatus(estado) {
  const normalized = String(estado || '').toLowerCase()

  if (normalized.includes('lista') || normalized.includes('cliente')) {
    return 'success'
  }

  if (normalized.includes('pendiente')) {
    return 'warning'
  }

  if (normalized.includes('validacion') || normalized.includes('geografica')) {
    return 'info'
  }

  return 'pending'
}

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

export default function TarjetaCotizacion({ cotizacion }) {
  return (
    <Tarjeta className="flex h-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <EtiquetaEstado status={obtenerStatus(cotizacion.estado)}>
            {cotizacion.estado}
          </EtiquetaEstado>
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{cotizacion.nombreCampana}</h3>
            <p className="mt-1 text-sm text-slate-500">{cotizacion.cliente}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-100 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pantallas</p>
          <p className="text-xl font-semibold text-slate-950">{cotizacion.totalPantallas}</p>
          <p className="mt-1 text-xs text-slate-500">
            Activas: {cotizacion.totalPantallasActivas}
          </p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Creada por</dt>
          <dd className="mt-2 text-sm font-medium text-slate-800">{cotizacion.usuarioCreadorNombre || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Fecha</dt>
          <dd className="mt-2 text-sm font-medium text-slate-800">{formatDate(cotizacion.fechaCreacion)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Boton as={Link} to={`/cotizaciones/${cotizacion.id}/tratamiento`}>
          Abrir tratamiento
        </Boton>
        <Boton as={Link} to={`/cotizaciones/${cotizacion.id}/mapa`} variant="secondary">
          Ver mapa
        </Boton>
      </div>
    </Tarjeta>
  )
}
