import Tarjeta from '../../../components/ui/Tarjeta'
import { useAutenticacion } from '../../autenticacion/context/useAutenticacion'
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
    titulo: 'Historial de Cotizaciones',
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
    titulo: 'Usuarios del Sistema',
    descripcion:
      'Panel interno para revisar credenciales vigentes, auditar actividad operacional y administrar acceso por rol.',
    estado: {
      status: 'warning',
      label: 'Administrador'
    },
    etiquetaBoton: 'Ver usuarios',
    ruta: '/usuarios',
    soloAdministrador: true
  }
]

export default function PanelPrincipal() {
  const { usuario } = useAutenticacion()

  const modulosVisibles = modulos.filter((modulo) => (
    !modulo.soloAdministrador || usuario?.rol === 'administrador'
  ))

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Centro de control administrativo
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              Opera cotizaciones y validacion geografica desde un unico flujo.
            </h2>
            <p className="text-base leading-8 text-slate-600">
              El panel ya valida autenticacion real contra la API externa y muestra cada modulo segun
              el rol de la cuenta activa.
            </p>
          </div>

          <Tarjeta className="min-w-[260px] space-y-2 bg-slate-950 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
              Estado operativo
            </p>
            <p className="text-3xl font-semibold">Acceso verificado</p>
            <p className="text-sm text-slate-300">
              Sesion real, rutas protegidas y visibilidad por rol activas.
            </p>
          </Tarjeta>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {modulosVisibles.map((modulo) => (
          <TarjetaModulo key={modulo.titulo} {...modulo} />
        ))}
      </section>
    </div>
  )
}
