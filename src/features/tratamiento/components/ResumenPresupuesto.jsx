import Tarjeta from '../../../components/ui/Tarjeta'

const COLUMNAS_BASE = new Set([
  'screenName',
  'city',
  'venueType',
  'latitude',
  'longitude',
  'dimensions',
  'impressions',
  'cardinalPoint',
  'status'
])

function sumaNumericaActiva(filas, key) {
  return filas.reduce((total, fila) => {
    if (!fila.is_active) {
      return total
    }

    const value = Number(fila[key])
    return total + (Number.isFinite(value) ? value : 0)
  }, 0)
}

export default function ResumenPresupuesto({ filas = [], columnas = [] }) {
  const totalPantallas = filas.length
  const pantallasActivas = filas.filter((fila) => fila.is_active).length
  const pantallasInactivas = totalPantallas - pantallasActivas
  const totalImpresionesActivas = sumaNumericaActiva(filas, 'impressions')

  const columnasCalculadas = columnas.filter((columna) => (
    !COLUMNAS_BASE.has(columna.key) &&
    filas.some((fila) => Number.isFinite(Number(fila[columna.key])))
  ))

  const cardsBase = [
    { label: 'Total pantallas', value: totalPantallas },
    { label: 'Pantallas activas', value: pantallasActivas },
    { label: 'Pantallas inactivas', value: pantallasInactivas },
    {
      label: 'Impresiones activas',
      value: totalImpresionesActivas.toLocaleString('es-MX')
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {cardsBase.map((card) => (
        <Tarjeta key={card.label} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
          <p className="text-3xl font-semibold text-slate-950">{card.value}</p>
        </Tarjeta>
      ))}

      {columnasCalculadas.map((columna) => (
        <Tarjeta key={columna.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Suma {columna.label}
          </p>
          <p className="text-3xl font-semibold text-slate-950">
            {sumaNumericaActiva(filas, columna.key).toLocaleString('es-MX', {
              maximumFractionDigits: 2
            })}
          </p>
        </Tarjeta>
      ))}
    </div>
  )
}
