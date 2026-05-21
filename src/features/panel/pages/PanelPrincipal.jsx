import Tarjeta from '../../../components/ui/Tarjeta'
import TarjetaModulo from '../components/TarjetaModulo'

const modulos = [
  {
    titulo: 'Cargar Nueva Cotizacion',
    descripcion:
      'Disparador del pipeline de ingesta. Permite arrastrar o seleccionar el archivo original del proveedor para iniciar el tratamiento operativo.',
    estado: {
      status: 'success',
      label: 'Disponible'
    },
    etiquetaBoton: 'Ir a carga',
    ruta: '/cotizaciones/nueva'
  },
  {
    titulo: 'Historial de Cotizaciones Anteriores',
    descripcion:
      'Listado indexado de propuestas guardadas con opcion de filtrado rapido por nombre de campana, cliente y responsable creador.',
    estado: {
      status: 'info',
      label: 'Indexado'
    },
    etiquetaBoton: 'Ver historial',
    ruta: '/cotizaciones/historial'
  },
  {
    titulo: 'Modulo de Usuarios del Sistema',
    descripcion:
      'Panel interno para revisar credenciales vigentes, auditar actividad operacional y entender quien origino cada propuesta.',
    estado: {
      status: 'warning',
      label: 'Interno'
    },
    etiquetaBoton: 'Ver usuarios',
    ruta: '/usuarios'
  }
]

export default function PanelPrincipal() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Centro de control administrativo
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              Opera cotizaciones, usuarios y validacion geografica desde un unico flujo.
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Esta base administrativa deja el frontend listo para integrar autenticacion real,
              parser avanzado y conexiones a la API PHP 8 externa en las siguientes fases.
            </p>
          </div>

          <Tarjeta className="min-w-[260px] space-y-2 bg-slate-950 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
              Estado operativo
            </p>
            <p className="text-3xl font-semibold">Frontend activo</p>
            <p className="text-sm text-slate-300">
              Rutas protegidas, modulos base y flujos mock listos para evolucionar.
            </p>
          </Tarjeta>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {modulos.map((modulo) => (
          <TarjetaModulo key={modulo.titulo} {...modulo} />
        ))}
      </section>
    </div>
  )
}
