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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

export default function TablaUsuarios({ usuarios }) {
  return (
    <Tarjeta className="ntp-glass-card hidden overflow-hidden p-0 lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="ntp-table-head">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Credenciales</th>
              <th className="px-6 py-4">Ultimo acceso</th>
              <th className="px-6 py-4 text-right">Cotizaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/55">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="align-top">
                <td className="px-6 py-5">
                  <p className="font-semibold text-slate-900">{usuario.nombre}</p>
                  {usuario.area && (
                    <p className="mt-1 text-sm text-slate-500">{usuario.area}</p>
                  )}
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">{usuario.correo || '-'}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{usuario.rol || '-'}</td>
                <td className="px-6 py-5">
                  <EtiquetaEstado status={getStatusVariant(usuario.estadoCredenciales)}>
                    {usuario.estadoCredenciales}
                  </EtiquetaEstado>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {formatDate(usuario.ultimoAcceso)}
                </td>
                <td className="px-6 py-5 text-right text-sm font-semibold text-slate-900">
                  {usuario.totalCotizacionesCreadas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  )
}
