import { useState } from 'react'
import Boton from '../../../components/ui/Boton'
import CampoTexto from '../../../components/ui/CampoTexto'

function normalizarLlave(valor) {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
}

export default function BotonAgregarColumna({ columnasExistentes = [], onAgregarColumna }) {
  const [open, setOpen] = useState(false)
  const [nombreColumna, setNombreColumna] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const nombreVisual = nombreColumna.trim()
    const key = normalizarLlave(nombreVisual)

    if (!nombreVisual) {
      setError('Ingresa un nombre de columna.')
      return
    }

    const exists = columnasExistentes.some((columna) => columna.key === key)

    if (exists) {
      setError('Ya existe una columna con ese nombre.')
      return
    }

    onAgregarColumna({
      key,
      label: nombreVisual
    })

    setError('')
    setNombreColumna('')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {open && (
        <CampoTexto
          label="Nueva columna"
          name="nuevaColumna"
          placeholder="Ej. CPM ajustado"
          value={nombreColumna}
          error={error}
          onChange={(event) => {
            setNombreColumna(event.target.value)
            if (error) {
              setError('')
            }
          }}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Boton variant="secondary" onClick={() => setOpen((current) => !current)}>
          {open ? 'Cancelar' : 'Agregar columna'}
        </Boton>
        {open && (
          <Boton onClick={handleSubmit}>
            Confirmar columna
          </Boton>
        )}
      </div>
    </div>
  )
}
