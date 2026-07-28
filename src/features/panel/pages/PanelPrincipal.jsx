import { useAutenticacion } from '../../autenticacion/context/useAutenticacion'
import TarjetaModulo from '../components/TarjetaModulo'
import checkMoradoIcon from '../../../assets/panel-icons/Check_Morado.png'
import graficaMoradoIcon from '../../../assets/panel-icons/Grafica_Barras_Morado.png'
import engraneMoradoIcon from '../../../assets/panel-icons/Engrane_Morado.png'

const modulos = [
  {
    titulo: 'Cargar Nueva Cotización',
    descripcion:
      'Selecciona el archivo original del proveedor para iniciar el tratamiento operativo.',
    etiquetaBoton: 'Ir a carga',
    ruta: '/cotizaciones/nueva',
    icono: checkMoradoIcon,
    altIcono: 'Ícono de validación para nueva cotización'
  },
  {
    titulo: 'Historial de Cotizaciones',
    descripcion:
      'Filtro por nombre de campaña, cliente o responsable creador de la campaña.',
    etiquetaBoton: 'Ver historial',
    ruta: '/cotizaciones/historial',
    icono: graficaMoradoIcon,
    altIcono: 'Ícono de barras para historial de cotizaciones'
  },
  {
    titulo: 'Usuarios del Sistema',
    descripcion:
      'Administra el acceso por rol de cada usuario.',
    etiquetaBoton: 'Ver usuarios',
    ruta: '/usuarios',
    icono: engraneMoradoIcon,
    altIcono: 'Ícono de configuración para usuarios del sistema',
    soloAdministrador: true
  }
]

export default function PanelPrincipal() {
  const { usuario } = useAutenticacion()

  const esAdministrador = usuario?.rol === 'administrador'
  const modulosVisibles = modulos.filter((modulo) => (
    !modulo.soloAdministrador || esAdministrador
  ))

  return (
    <div className="ntp-aurora-bg--panel space-y-10">
      <section className="max-w-4xl space-y-4 pt-2">
        <h2 className="ntp-page-title max-w-3xl text-5xl leading-[0.92] sm:text-6xl xl:text-[5.25rem]">
          <span className="block">Cotización y</span>
          <span className="block">Validación Geográfica</span>
        </h2>
        <p className="ntp-body-copy max-w-2xl text-base leading-7 sm:text-lg">
          Crea tu próxima campaña DOOH aquí...
        </p>
      </section>

      <section className={`grid gap-6 md:grid-cols-2 ${esAdministrador ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
        {modulosVisibles.map((modulo) => (
          <TarjetaModulo key={modulo.titulo} {...modulo} />
        ))}
      </section>
    </div>
  )
}
