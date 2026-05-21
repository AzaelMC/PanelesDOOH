import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function SelectorHoja({
  hojas = [],
  nombreHojaSeleccionada = '',
  onSeleccionarHoja,
  motivoDeteccion = ''
}) {
  if (!hojas.length) {
    return null
  }

  return (
    <Tarjeta className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Hoja analizada</h3>
        <p className="text-sm text-slate-500">
          Puedes cambiar manualmente la hoja si el sistema no apunto a la correcta.
        </p>
      </div>

      <CampoTexto
        as="select"
        label="Seleccion de hoja"
        value={nombreHojaSeleccionada}
        onChange={(event) => onSeleccionarHoja(event.target.value)}
      >
        {hojas.map((hoja) => (
          <option key={hoja.nombre} value={hoja.nombre}>
            {hoja.nombre}
          </option>
        ))}
      </CampoTexto>

      <p className="text-xs text-slate-500">
        {motivoDeteccion
          ? `Deteccion inicial: ${motivoDeteccion.split('_').join(' ')}.`
          : 'Selecciona manualmente una hoja para reanalizar el archivo.'}
      </p>
    </Tarjeta>
  )
}
