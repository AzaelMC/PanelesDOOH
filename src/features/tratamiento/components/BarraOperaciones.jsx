import { useState } from 'react'
import Boton from '../../../components/ui/Boton'
import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'

const operaciones = [
  { value: 'suma', label: 'Suma' },
  { value: 'resta', label: 'Resta' },
  { value: 'multiplicacion', label: 'Multiplicacion' },
  { value: 'division', label: 'Division' },
  { value: 'porcentaje', label: 'Porcentaje' }
]

export default function BarraOperaciones({ columnasNumericas = [], onAplicarOperacion, disabled = false }) {
  const [formData, setFormData] = useState({
    columnaOrigen: '',
    operacion: 'suma',
    valor: '',
    columnaResultado: '',
    aplicarInactivas: false
  })
  const [error, setError] = useState('')

  const columnaOrigenActual = columnasNumericas.some(
    (columna) => columna.key === formData.columnaOrigen
  )
    ? formData.columnaOrigen
    : columnasNumericas[0]?.key || ''

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) {
      setError('')
    }
  }

  const handleApply = () => {
    if (disabled) {
      return
    }

    if (!columnaOrigenActual || !formData.columnaResultado.trim() || formData.valor === '') {
      setError('Completa columna origen, valor y nombre de resultado.')
      return
    }

    onAplicarOperacion({
      ...formData,
      columnaOrigen: columnaOrigenActual
    })
  }

  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">Motor matematico en vivo</h3>
        <p className="text-sm text-slate-500">
          Aplica operaciones a columnas numericas y crea columnas derivadas redondeadas a 2 decimales.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_0.8fr_1.1fr_auto]">
        <CampoTexto
          as="select"
          label="Columna origen"
          name="columnaOrigen"
          value={columnaOrigenActual}
          onChange={handleChange}
          disabled={disabled}
        >
          {columnasNumericas.map((columna) => (
            <option key={columna.key} value={columna.key}>
              {columna.label}
            </option>
          ))}
        </CampoTexto>

        <CampoTexto
          as="select"
          label="Operacion"
          name="operacion"
          value={formData.operacion}
          onChange={handleChange}
          disabled={disabled}
        >
          {operaciones.map((operacion) => (
            <option key={operacion.value} value={operacion.value}>
              {operacion.label}
            </option>
          ))}
        </CampoTexto>

        <CampoTexto
          label="Valor"
          name="valor"
          type="number"
          value={formData.valor}
          onChange={handleChange}
          placeholder="10"
          disabled={disabled}
        />

        <CampoTexto
          label="Columna resultado"
          name="columnaResultado"
          value={formData.columnaResultado}
          onChange={handleChange}
          placeholder="Ej. impressions_ajustadas"
          disabled={disabled}
        />

        <div className="flex items-end">
          <Boton onClick={handleApply} disabled={disabled || columnasNumericas.length === 0}>
            Aplicar operacion
          </Boton>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          name="aplicarInactivas"
          checked={formData.aplicarInactivas}
          onChange={handleChange}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
        />
        Aplicar tambien a pantallas inactivas
      </label>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </Tarjeta>
  )
}
