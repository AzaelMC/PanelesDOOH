import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

function getStatusVariant(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'activo' || normalized === 'vigentes' || normalized === 'vigente') {
    return 'success'
  }

  if (normalized === 'pendientes' || normalized === 'pendiente') {
    return 'warning'
  }

  return 'inactive'
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

export default function TarjetaUsuario({ usuario }) {
  return (
    <Tarjeta className="space-y-5 lg:hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">{usuario.nombre}</p>
          <p className="mt-1 text-sm text-slate-500">{usuario.correo || usuario.rol}</p>
        </div>
        <EtiquetaEstado status={getStatusVariant(usuario.estadoCredenciales)}>
          {usuario.estadoCredenciales}
        </EtiquetaEstado>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Rol</dt>
          <dd className="mt-2 text-sm text-slate-800">{usuario.rol || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Ultimo acceso</dt>
          <dd className="mt-2 text-sm text-slate-800">{formatDate(usuario.ultimoAcceso)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Cotizaciones</dt>
          <dd className="mt-2 text-sm text-slate-800">{usuario.totalCotizacionesCreadas}</dd>
        </div>
        {usuario.area && (
          <div>
            <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Area</dt>
            <dd className="mt-2 text-sm text-slate-800">{usuario.area}</dd>
          </div>
        )}
      </dl>
    </Tarjeta>
  )
}
