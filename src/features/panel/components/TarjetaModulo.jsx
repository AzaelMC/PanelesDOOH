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
    <Tarjeta className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-4">
        <EtiquetaEstado status={estado.status}>{estado.label}</EtiquetaEstado>
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-slate-950">{titulo}</h3>
          <p className="text-sm leading-7 text-slate-600">{descripcion}</p>
        </div>
      </div>

      <Boton as={Link} to={ruta} variant="secondary">
        {etiquetaBoton}
      </Boton>
    </Tarjeta>
  )
}
