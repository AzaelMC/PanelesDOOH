import { Link } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function TarjetaModulo({
  titulo,
  descripcion,
  etiquetaBoton,
  ruta,
  icono,
  altIcono
}) {
  return (
    <Tarjeta className="ntp-glass-card flex h-full flex-col justify-between gap-7 rounded-[30px] p-6 sm:p-7">
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <img
            src={icono}
            alt={altIcono || ''}
            className="h-20 w-20 object-contain"
          />
        </div>

        <div className="min-w-0 space-y-2 pt-1">
          <h3 className="ntp-page-title text-[1.5rem] leading-[1] sm:text-[1.65rem]">{titulo}</h3>
          <p className="ntp-body-copy text-sm leading-6 sm:text-[0.95rem]">{descripcion}</p>
        </div>
      </div>

      <Boton
        as={Link}
        to={ruta}
        variant="brandSecondary"
        fullWidth
        className="border-slate-200 bg-white/88 text-[var(--ntp-grape-button)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white"
      >
        {etiquetaBoton}
      </Boton>
    </Tarjeta>
  )
}
