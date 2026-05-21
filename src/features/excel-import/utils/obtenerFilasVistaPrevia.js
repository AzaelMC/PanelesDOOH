/**
 * Extrae las primeras filas para la vista previa.
 *
 * @param {Array} filas - Arreglo de filas
 * @param {number} limite - Maximo de filas a devolver
 * @returns {Array} Filas para vista previa
 */
export function obtenerFilasVistaPrevia(filas = [], limite = 10) {
  if (!Array.isArray(filas)) {
    return []
  }

  return filas.slice(0, limite)
}

/**
 * Extrae filas y las mapea segun las columnas detectadas.
 *
 * @param {Array} filas - Arreglo de filas
 * @param {Object} columnasDetectadas - Columnas detectadas con indices
 * @param {number} limite - Maximo de filas
 * @returns {Array} Filas mapeadas para vista previa
 */
export function obtenerYMapearFilas(filas = [], columnasDetectadas = {}, limite = 10) {
  const vistaPrevia = obtenerFilasVistaPrevia(filas, limite)

  return vistaPrevia.map((fila) => {
    const filaMapeada = {}

    Object.entries(columnasDetectadas).forEach(([key, { index }]) => {
      if (Array.isArray(fila)) {
        filaMapeada[key] = fila[index] || null
      } else if (typeof fila === 'object' && fila !== null) {
        filaMapeada[key] = fila[Object.keys(fila)[index]] || null
      }
    })

    return filaMapeada
  })
}
