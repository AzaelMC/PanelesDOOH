import { normalizarEncabezado } from '../../excel-import/utils/normalizarEncabezados'

const MAP_ALIASES = new Set(['maps', 'map', 'mapa', 'mapas'])

function esColumnaMaps(valor) {
  return MAP_ALIASES.has(normalizarEncabezado(valor))
}

function extractColumnCandidates(column) {
  if (typeof column === 'string') {
    return [column]
  }

  if (!column || typeof column !== 'object') {
    return []
  }

  return [
    column.key,
    column.id,
    column.accessorKey,
    column.label,
    column.nombre,
    column.header
  ].filter(Boolean)
}

export function eliminarColumnaMaps(columnas = [], filas = []) {
  const indicesRemovidos = []
  const clavesRemovidas = new Set()

  const columnasLimpias = columnas.filter((columna, index) => {
    const shouldRemove = extractColumnCandidates(columna).some((candidate) => esColumnaMaps(candidate))

    if (shouldRemove) {
      indicesRemovidos.push(index)
      extractColumnCandidates(columna).forEach((candidate) => {
        clavesRemovidas.add(normalizarEncabezado(candidate))
      })
      return false
    }

    return true
  })

  const filasLimpias = filas.map((fila) => {
    if (Array.isArray(fila)) {
      return fila.filter((_, index) => !indicesRemovidos.includes(index))
    }

    if (!fila || typeof fila !== 'object') {
      return fila
    }

    return Object.fromEntries(
      Object.entries(fila).filter(([key]) => !clavesRemovidas.has(normalizarEncabezado(key)))
    )
  })

  return {
    columnasLimpias,
    filasLimpias,
    columnaEliminada: columnasLimpias.length !== columnas.length
  }
}
