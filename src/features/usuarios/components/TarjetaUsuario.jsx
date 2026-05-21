import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

function getStatusVariant(status) {
  if (status === 'Vigentes') {
    return 'success'
  }

  if (status === 'Pendientes') {
    return 'warning'
  }

  return 'inactive'
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

export default function TarjetaUsuario({ usuario }) {
  return (
    <Tarjeta className="space-y-5 lg:hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">{usuario.nombre}</p>
          <p className="mt-1 text-sm text-slate-500">{usuario.rol}</p>
        </div>
        <EtiquetaEstado status={getStatusVariant(usuario.estadoCredenciales)}>
          {usuario.estadoCredenciales}
        </EtiquetaEstado>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Area</dt>
          <dd className="mt-2 text-sm text-slate-800">{usuario.area}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Ultimo acceso</dt>
          <dd className="mt-2 text-sm text-slate-800">{formatDate(usuario.ultimoAcceso)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Cotizaciones</dt>
          <dd className="mt-2 text-sm text-slate-800">{usuario.totalCotizacionesCreadas}</dd>
        </div>
      </dl>
    </Tarjeta>
  )
}
