import { Link } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function TarjetaModulo({
  titulo,
  descripcion,
  estado,
  etiquetaBoton,
  ruta
}) {
  return (
    <Tarjeta className="ntp-glass-card flex h-full flex-col justify-between gap-6">
      <div className="space-y-4">
        <EtiquetaEstado status={estado.status}>{estado.label}</EtiquetaEstado>
        <div className="space-y-3">
          <h3 className="ntp-page-title text-2xl">{titulo}</h3>
          <p className="ntp-body-copy text-sm leading-7">{descripcion}</p>
        </div>
      </div>

      <Boton as={Link} to={ruta} variant="brandSecondary">
        {etiquetaBoton}
      </Boton>
    </Tarjeta>
  )
}
