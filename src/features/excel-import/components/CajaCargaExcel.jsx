import { useState } from 'react'
import Tarjeta from '../../../components/ui/Tarjeta'
import Boton from '../../../components/ui/Boton'

const EXTENSIONES_VALIDAS = ['xlsx', 'xls', 'csv']

function obtenerExtension(fileName = '') {
  const segments = fileName.split('.')
  return segments.length > 1 ? segments.pop().toLowerCase() : ''
}

export default function CajaCargaExcel({ onFileSelect, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')

  const validarArchivo = (file) => {
    if (!file) {
      return false
    }

    const extension = obtenerExtension(file.name)
    const isValid = EXTENSIONES_VALIDAS.includes(extension)

    setError(isValid ? '' : 'Formato no valido. Usa archivos .xlsx, .xls o .csv.')
    return isValid
  }

  const dispatchFile = (file) => {
    if (validarArchivo(file) && onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    if (event.dataTransfer.files.length > 0) {
      dispatchFile(event.dataTransfer.files[0])
    }
  }

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      dispatchFile(event.target.files[0])
    }
  }

  return (
    <Tarjeta className={`border-2 border-dashed ${isDragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300'}`}>
      <div
        className="flex flex-col items-center justify-center gap-4 py-12"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <div className="text-center">
          <p className="font-medium text-slate-700">Arrastra tu archivo Excel o CSV aqui</p>
          <p className="mt-1 text-sm text-slate-500">Tambien puedes seleccionarlo manualmente.</p>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="excel-upload"
        />

        <label htmlFor="excel-upload">
          <Boton as="span" disabled={disabled}>
            Seleccionar archivo
          </Boton>
        </label>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
